import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TicketHeader from './components/TicketHeader';
import TicketSearchBar from './components/TicketSearchBar';
import TicketStatsGrid from './components/TicketStatsGrid';
import TicketTable from './components/TicketTable';
import TicketDetailModal from './components/TicketDetailModal';
import { useAuth } from '@/context/AuthContext';
import {
    ticketService,
    type TicketDTO,
    type CommentDTO,
    type AttachmentDTO,
} from '@/services/ticket/ticketService';
import {
    enhanceTicketDetail,
    enhanceMessage,
    mergeAttachments,
    extractErrorMessage,
    attachmentFromDto,
    truncateText,
} from './utils';
import type {
    TicketStats,
    TicketSummary,
    TicketDetail,
    TicketUserSummary,
    TicketParticipant,
    TicketAttachment,
    TicketMessage,
    TicketTimelineEvent,
} from './types';

const ITEMS_PER_PAGE = 8;
const TICKET_FETCH_SIZE = 500;

let tempIdCounter = 100000;
const nextTempId = () => ++tempIdCounter;

const normalizeStatus = (value?: string | null): TicketSummary['status'] => {
    const normalized = (value ?? 'OPEN').replace(/[-\s]+/g, '_').toUpperCase();
    if (['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'].includes(normalized)) {
        return normalized as TicketSummary['status'];
    }
    return 'OPEN';
};

const normalizePriority = (value?: string | null): TicketDetail['priority'] => {
    const normalized = (value ?? 'LOW').replace(/[-\s]+/g, '_').toUpperCase();
    if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(normalized)) {
        return normalized as TicketDetail['priority'];
    }
    return 'LOW';
};

const createUserSummary = (
    id: number | null | undefined,
    name: string | null | undefined,
    email: string | null | undefined,
    avatarUrl?: string | null,
    role?: string | null,
): TicketUserSummary => ({
    id: id ?? nextTempId(),
    name: name?.trim() && name.length > 0 ? name : 'Unknown User',
    email: email ?? '',
    avatarUrl: avatarUrl ?? undefined,
    role: role ?? undefined,
});

const createParticipant = (user: TicketUserSummary | undefined, presence: TicketParticipant['presence'] = 'online'): TicketParticipant | null => {
    if (!user) return null;
    return {
        ...user,
        presence,
    };
};

const toTicketAttachment = (attachment: AttachmentDTO): TicketAttachment =>
    attachmentFromDto(attachment);

const buildTimeline = (
    ticket: TicketDTO,
    messages: TicketMessage[],
): TicketTimelineEvent[] => {
    const events: TicketTimelineEvent[] = [];
    const createdAt = ticket.createdAt ?? new Date().toISOString();

    events.push({
        id: `created-${ticket.id}`,
        label: 'Ticket created',
        description: ticket.userName ?? undefined,
        icon: 'CREATED',
        createdAt,
    });

    const statusLabel = ticket.status?.replace(/[_-]/g, ' ').toUpperCase() ?? 'UNKNOWN';
    events.push({
        id: `status-${ticket.id}`,
        label: `Status: ${statusLabel}`,
        icon: 'STATUS',
        createdAt: ticket.updatedAt ?? createdAt,
    });

    if (ticket.updatedAt && ticket.updatedAt !== createdAt) {
        events.push({
            id: `updated-${ticket.id}`,
            label: 'Ticket updated',
            icon: 'UPDATED',
            createdAt: ticket.updatedAt,
        });
    }

    messages.forEach((message) => {
        events.push({
            id: `comment-${message.id}`,
            label: `${message.author.name} commented`,
            description: truncateText(message.content, 80),
            icon: 'COMMENT',
            createdAt: message.createdAt,
        });
    });

    return events.sort((a, b) => {
        const first = new Date(a.createdAt).getTime();
        const second = new Date(b.createdAt).getTime();
        return first - second;
    });
};

const convertCommentToMessage = (
    comment: CommentDTO,
    currentUserId: number | null,
): TicketMessage => {
    const attachments = (comment.attachments ?? []).map(toTicketAttachment);
    const message: TicketMessage = {
        id: comment.id ?? nextTempId(),
        content: comment.content ?? '',
        createdAt: comment.createdAt ?? new Date().toISOString(),
        status: comment.userId && currentUserId && comment.userId === currentUserId ? 'SENT' : 'READ',
        author: createUserSummary(
            comment.userId,
            comment.userName,
            comment.userEmail,
            comment.avatarUrl,
            comment.isInternal ? 'Internal' : 'Collaborator',
        ),
        attachments,
    };
    return enhanceMessage(message);
};

const mapTicketDtoToSummary = (ticket: TicketDTO): TicketSummary => ({
    id: ticket.id,
    subject: ticket.subject ?? 'Untitled Ticket',
    category: 'General',
    status: normalizeStatus(ticket.status),
    priority: normalizePriority(ticket.priority),
    createdAt: ticket.createdAt ?? new Date().toISOString(),
    updatedAt: ticket.updatedAt ?? ticket.createdAt ?? new Date().toISOString(),
    shortDescription: truncateText(ticket.description),
    tags: [],
});

const mapTicketDtoToDetail = (
    ticket: TicketDTO,
    currentUserId: number | null,
): TicketDetail => {
    const summary = mapTicketDtoToSummary(ticket);
    const reporter = createUserSummary(
        ticket.userId,
        ticket.userName,
        ticket.userEmail,
        ticket.avtarUrl,
        'Reporter',
    );

    const primaryAssignee = ticket.assignees?.[0]
        ? createUserSummary(
            ticket.assignees[0].id,
            ticket.assignees[0].name,
            ticket.assignees[0].email,
            ticket.assignees[0].avatarUrl,
            'Assignee',
        )
        : undefined;

    const participantMap = new Map<number, TicketParticipant>();
    const registerParticipant = (userSummary?: TicketUserSummary, presence: TicketParticipant['presence'] = 'online') => {
        const participant = createParticipant(userSummary, presence);
        if (!participant) return;
        if (!participantMap.has(participant.id)) {
            participantMap.set(participant.id, participant);
        }
    };

    registerParticipant(reporter, 'online');
    ticket.assignees?.forEach((assignee) => {
        registerParticipant(
            createUserSummary(
                assignee.id,
                assignee.name,
                assignee.email,
                assignee.avatarUrl,
                'Assignee',
            ),
        );
    });

    const messages = (ticket.comments ?? []).map((comment) => {
        const message = convertCommentToMessage(comment, currentUserId);
        registerParticipant(message.author);
        return message;
    });

    const attachments = messages.reduce<TicketAttachment[]>((acc, message) => {
        const merged = mergeAttachments(acc, message.attachments ?? []);
        return merged;
    }, []);

    const timeline = buildTimeline(ticket, messages);

    return enhanceTicketDetail({
        ...summary,
        description: ticket.description ?? '',
        reporter,
        assignee: primaryAssignee,
        participants: Array.from(participantMap.values()),
        attachments,
        messages,
        timeline,
    });
};

const mapCommentDtoToMessage = (
    comment: CommentDTO,
    currentUserId: number | null,
): TicketMessage => convertCommentToMessage(comment, currentUserId);

const TicketManagement: React.FC = () => {
    const { currentUser } = useAuth();
    const currentUserId = currentUser?.id ?? null;

    const [allTickets, setAllTickets] = useState<TicketSummary[]>([]);
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const wsClientRef = useRef<any | null>(null);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [allResponse, openResponse, inProgressResponse, closedResponse] = await Promise.all([
                ticketService.getAllTickets({
                    page: 0,
                    size: TICKET_FETCH_SIZE,
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                }),
                ticketService.getAllTickets({ page: 0, size: 1, status: 'open' }),
                ticketService.getAllTickets({ page: 0, size: 1, status: 'in_progress' }),
                ticketService.getAllTickets({ page: 0, size: 1, status: 'closed' }),
            ]);

            setAllTickets(allResponse.content.map(mapTicketDtoToSummary));
            setStats({
                total: allResponse.totalElements,
                open: openResponse.totalElements,
                inProgress: inProgressResponse.totalElements,
                closed: closedResponse.totalElements,
            });
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to load tickets. Please try again.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchTickets();
    }, [fetchTickets]);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            setMousePos({ x: event.clientX, y: event.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => () => {
        if (wsClientRef.current) {
            try {
                if (typeof wsClientRef.current.deactivate === 'function') {
                    wsClientRef.current.deactivate();
                } else if (typeof wsClientRef.current.disconnect === 'function') {
                    wsClientRef.current.disconnect();
                }
            } catch (disconnectError) {
                console.warn('Failed to disconnect WebSocket client on unmount:', disconnectError);
            } finally {
                wsClientRef.current = null;
            }
        }
    }, []);

    const filteredTickets = useMemo(() => {
        const normalized = searchQuery.trim().toLowerCase();
        if (!normalized) {
            return allTickets;
        }

        return allTickets.filter((ticket) => {
            const haystack = [
                ticket.subject,
                ticket.category,
                ticket.status,
                ticket.priority,
                ticket.shortDescription,
                ...ticket.tags,
            ]
                .filter((value): value is string => typeof value === 'string' && value !== '')
                .map((value) => value.toLowerCase());

            return haystack.some((value) => value.includes(normalized));
        });
    }, [allTickets, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE) || 1);

    useEffect(() => {
        setCurrentPage((previous) => (previous <= totalPages ? previous : totalPages));
    }, [totalPages]);

    const paginatedTickets = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredTickets]);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleOpenTicket = useCallback(async (ticketId: number) => {
        setIsModalOpen(true);
        setActiveTicketId(ticketId);
        setDetailLoading(true);
        setDetailError(null);
        setSelectedTicket(null);

        try {
            const detail = await ticketService.getTicketDetails(ticketId);
            setSelectedTicket(mapTicketDtoToDetail(detail, currentUserId));
            const storedToken = localStorage.getItem('accountToken');
            if (wsClientRef.current) {
                try {
                    if (typeof wsClientRef.current.deactivate === 'function') {
                        wsClientRef.current.deactivate();
                    } else if (typeof wsClientRef.current.disconnect === 'function') {
                        wsClientRef.current.disconnect();
                    }
                } catch (disconnectError) {
                    console.warn('Failed to disconnect previous WebSocket client:', disconnectError);
                }
            }
            wsClientRef.current = ticketService.connectToTicketChat(
                ticketId,
                (message: CommentDTO) => {
                    const newMessage = mapCommentDtoToMessage(message, currentUserId);
                    setSelectedTicket((previous) => {
                        if (!previous || previous.id !== ticketId) {
                            return previous;
                        }
                        if (previous.messages.some((existing) => existing.id === newMessage.id)) {
                            return previous;
                        }
                        const updatedMessages = [...previous.messages, newMessage];
                        const updatedAttachments = mergeAttachments(
                            previous.attachments ?? [],
                            newMessage.attachments ?? [],
                        );
                        const newTimelineEvent: TicketTimelineEvent = {
                            id: `comment-${newMessage.id}`,
                            label: `${newMessage.author.name} commented`,
                            description: truncateText(newMessage.content, 80),
                            icon: 'COMMENT',
                            createdAt: newMessage.createdAt,
                        };
                        return {
                            ...previous,
                            messages: updatedMessages,
                            attachments: updatedAttachments,
                            timeline: [...previous.timeline, newTimelineEvent],
                            updatedAt: newMessage.createdAt,
                        };
                    });
                    setAllTickets((previous) =>
                        previous.map((ticket) =>
                            ticket.id === ticketId
                                ? { ...ticket, updatedAt: newMessage.createdAt }
                                : ticket,
                        ),
                    );
                },
                storedToken ?? undefined,
            );
        } catch (err) {
            setDetailError(extractErrorMessage(err, 'Failed to load ticket detail.'));
        } finally {
            setDetailLoading(false);
        }
    }, [currentUserId]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setActiveTicketId(null);
        setSelectedTicket(null);
        setDetailError(null);
        if (wsClientRef.current) {
            try {
                if (typeof wsClientRef.current.deactivate === 'function') {
                    wsClientRef.current.deactivate();
                } else if (typeof wsClientRef.current.disconnect === 'function') {
                    wsClientRef.current.disconnect();
                }
            } catch (disconnectError) {
                console.warn('Failed to disconnect WebSocket client:', disconnectError);
            } finally {
                wsClientRef.current = null;
            }
        }
    };

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchTickets();
            if (activeTicketId) {
                const detail = await ticketService.getTicketDetails(activeTicketId);
                setSelectedTicket(mapTicketDtoToDetail(detail, currentUserId));
                setDetailError(null);
            }
        } catch (err) {
            setError(extractErrorMessage(err, 'Unable to refresh tickets.'));
        } finally {
            setTimeout(() => setRefreshing(false), 600);
        }
    }, [activeTicketId, currentUserId, fetchTickets]);

    const handleSendMessage = useCallback(
        async ({ content, attachments }: { content: string; attachments?: File[] }) => {
            if (!activeTicketId) {
                throw new Error('Ticket is not available.');
            }
            if (!currentUserId) {
                throw new Error('Current user is not available.');
            }

            const messagePayload: CommentDTO = {
                content,
                userId: currentUserId,
                userName: currentUser?.fullName ?? currentUser?.username ?? 'You',
                userEmail: currentUser?.email ?? '',
            };

            try {
                const response = await ticketService.sendMessageWithAttachments(
                    activeTicketId,
                    messagePayload,
                    attachments ?? [],
                );

                const newMessage = mapCommentDtoToMessage(response, currentUserId);

                setSelectedTicket((previous) => {
                    if (!previous) {
                        return previous;
                    }
                    const updatedMessages = [...previous.messages, newMessage];
                    const updatedAttachments = mergeAttachments(previous.attachments ?? [], newMessage.attachments ?? []);
                    const newTimelineEvent: TicketTimelineEvent = {
                        id: `comment-${newMessage.id}`,
                        label: `${newMessage.author.name} commented`,
                        description: truncateText(newMessage.content, 80),
                        icon: 'COMMENT',
                        createdAt: newMessage.createdAt,
                    };
                    return {
                        ...previous,
                        messages: updatedMessages,
                        attachments: updatedAttachments,
                        timeline: [...previous.timeline, newTimelineEvent],
                        updatedAt: newMessage.createdAt,
                    };
                });

                setAllTickets((previous) =>
                    previous.map((ticket) =>
                        ticket.id === activeTicketId
                            ? { ...ticket, updatedAt: newMessage.createdAt }
                            : ticket,
                    ),
                );
            } catch (err) {
                throw new Error(extractErrorMessage(err, 'Failed to send message.'));
            }
        },
        [activeTicketId, currentUser, currentUserId],
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white font-light relative overflow-hidden">
            <div
                className="fixed pointer-events-none z-0 transition-all duration-300 ease-out"
                style={{
                    left: mousePos.x,
                    top: mousePos.y,
                    width: '600px',
                    height: '600px',
                    transform: 'translate(-50%, -50%)',
                    background:
                        'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)',
                }}
            />

            <div className="fixed inset-0 z-0 opacity-20">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                <TicketHeader
                    heading="Ticket"
                    highlight="Management"
                    description="View and collaborate on all customer tickets"
                />
                <TicketSearchBar value={searchQuery} onChange={handleSearchChange} />
                <TicketStatsGrid stats={stats} fallbackTotal={filteredTickets.length} />

                {error && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center justify-between gap-4">
                        <span>{error}</span>
                        <button
                            onClick={() => void fetchTickets()}
                            className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors duration-200"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="mb-4 text-gray-400 text-sm">Loading tickets...</div>
                )}

                <TicketTable
                    tickets={paginatedTickets}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={ITEMS_PER_PAGE}
                    filteredCount={filteredTickets.length}
                    onPageChange={handlePageChange}
                    onViewTicket={handleOpenTicket}
                    onRefresh={handleRefresh}
                    isRefreshing={refreshing}
                />
            </div>

            <TicketDetailModal
                ticket={selectedTicket}
                ticketId={activeTicketId}
                statusHint={paginatedTickets.find((ticket) => ticket.id === activeTicketId)?.status}
                priorityHint={paginatedTickets.find((ticket) => ticket.id === activeTicketId)?.priority}
                isOpen={isModalOpen}
                isLoading={detailLoading}
                error={detailError}
                onClose={handleCloseModal}
                onSendMessage={handleSendMessage}
            />

            <style>{`
            @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
            }

            .animate-spin {
            animation: spin 1s linear;
            }

            @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
            }

            ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
            }

            ::-webkit-scrollbar-track {
            background: rgba(17, 24, 39, 0.3);
            border-radius: 4px;
            }

            ::-webkit-scrollbar-thumb {
            background: rgba(6, 182, 212, 0.3);
            border-radius: 4px;
            }

            ::-webkit-scrollbar-thumb:hover {
            background: rgba(6, 182, 212, 0.5);
            }
        `}</style>
        </div>
    );
};

export default TicketManagement;
