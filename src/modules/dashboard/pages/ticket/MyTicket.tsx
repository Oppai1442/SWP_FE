import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TicketHeader from './components/TicketHeader';
import TicketSearchBar from './components/TicketSearchBar';
import TicketStatsGrid from './components/TicketStatsGrid';
import TicketTable from './components/TicketTable';
import TicketDetailModal from './components/TicketDetailModal';
import {
  getMyTicketsAPI,
  getTicketDetailAPI,
  postTicketMessageAPI,
} from './services/ticketService';
import { ticketService as realtimeTicketService, type CommentDTO } from '@/services/ticket/ticketService';
import type {
  CreateTicketMessageRequest,
  TicketDetail,
  TicketListResponse,
  TicketMessage,
  TicketSummary,
} from './types';
import {
  enhanceTicketDetail,
  enhanceMessage,
  mergeAttachments,
  extractErrorMessage,
  convertCommentToMessage,
  truncateText,
} from './utils';

const ITEMS_PER_PAGE = 8;

const MyTicket: React.FC = () => {
  const [overview, setOverview] = useState<TicketListResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const wsClientRef = useRef<any | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyTicketsAPI();
      setOverview(response);
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

  const tickets: TicketSummary[] = overview?.tickets ?? [];

  const filteredTickets = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      const haystack = [
        ticket.subject,
        ticket.category,
        ticket.status,
        ticket.priority,
        ticket.shortDescription,
        ...(ticket.tags ?? []),
      ]
        .filter((value): value is string => typeof value === 'string' && value !== '')
        .map((value) => value.toLowerCase());

      return haystack.some((value) => value.includes(normalized));
    });
  }, [searchQuery, tickets]);

  const filteredCount = filteredTickets.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / ITEMS_PER_PAGE) || 1);

  useEffect(() => {
    setCurrentPage((previous) => {
      if (previous <= totalPages) {
        return previous;
      }
      return totalPages;
    });
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTickets();
      if (activeTicketId) {
        const detail = await getTicketDetailAPI(activeTicketId);
        setSelectedTicket(enhanceTicketDetail(detail));
        setDetailError(null);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to refresh tickets.'));
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  }, [activeTicketId, fetchTickets]);

  const handleOpenTicket = useCallback(
    async (ticketId: number) => {
      setIsModalOpen(true);
      setActiveTicketId(ticketId);
      setDetailLoading(true);
      setDetailError(null);
      setSelectedTicket(null);

      try {
        const detail = await getTicketDetailAPI(ticketId);
        const enhancedDetail = enhanceTicketDetail(detail);
        setSelectedTicket(enhancedDetail);
        const viewerId = enhancedDetail.reporter?.id ?? null;
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
        wsClientRef.current = realtimeTicketService.connectToTicketChat(
          ticketId,
          (message: CommentDTO) => {
            const newMessage = convertCommentToMessage(message, viewerId);
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
              return {
                ...previous,
                messages: updatedMessages,
                attachments: updatedAttachments,
                timeline: [...previous.timeline, {
                  id: `comment-${newMessage.id}`,
                  label: `${newMessage.author.name} commented`,
                  description: truncateText(newMessage.content, 80),
                  icon: 'COMMENT',
                  createdAt: newMessage.createdAt,
                }],
                updatedAt: newMessage.createdAt,
              };
            });
            setOverview((previous) => {
              if (!previous) return previous;
              return {
                ...previous,
                tickets: previous.tickets.map((ticket) =>
                  ticket.id === ticketId
                    ? { ...ticket, updatedAt: newMessage.createdAt }
                    : ticket,
                ),
              };
            });
          },
          storedToken ?? undefined,
        );
      } catch (err) {
        setDetailError(extractErrorMessage(err, 'Failed to load ticket detail.'));
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

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

  const handleSendMessage = useCallback(
    async (payload: { content: string; attachments?: File[] }) => {
      if (!activeTicketId) {
        throw new Error('Ticket is not available.');
      }

      const request: CreateTicketMessageRequest = {
        content: payload.content,
        isInternal: false,
      };

      try {
        const message: TicketMessage = await postTicketMessageAPI(
          activeTicketId,
          request,
          payload.attachments ?? [],
        );
        const enhancedMessage = enhanceMessage(message);
        const messageTimestamp = message.createdAt ?? new Date().toISOString();

        setSelectedTicket((previous) => {
          if (!previous) {
            return previous;
          }

          const updatedAttachments = mergeAttachments(
            previous.attachments ?? [],
            enhancedMessage.attachments ?? [],
          );

          return {
            ...previous,
            messages: [...previous.messages, enhancedMessage],
            attachments: updatedAttachments,
            timeline: [...previous.timeline, {
              id: `comment-${enhancedMessage.id}`,
              label: `${enhancedMessage.author.name} commented`,
              description: truncateText(enhancedMessage.content, 80),
              icon: 'COMMENT',
              createdAt: messageTimestamp,
            }],
            updatedAt: messageTimestamp,
          };
        });

        setOverview((previous) => {
          if (!previous) {
            return previous;
          }
          return {
            ...previous,
            tickets: previous.tickets.map((ticket) =>
              ticket.id === activeTicketId
                ? { ...ticket, updatedAt: messageTimestamp }
                : ticket,
            ),
          };
        });
      } catch (err) {
        throw new Error(extractErrorMessage(err, 'Failed to send message.'));
      }
    },
    [activeTicketId],
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
        <TicketHeader />
        <TicketSearchBar value={searchQuery} onChange={handleSearchChange} />
        <TicketStatsGrid stats={overview?.stats ?? null} fallbackTotal={tickets.length} />

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
          filteredCount={filteredCount}
          onPageChange={handlePageChange}
          onViewTicket={handleOpenTicket}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        />
      </div>

      <TicketDetailModal
        ticket={selectedTicket}
        ticketId={activeTicketId}
        statusHint={
          paginatedTickets.find((ticket) => ticket.id === activeTicketId)?.status ??
          tickets.find((ticket) => ticket.id === activeTicketId)?.status
        }
        priorityHint={
          paginatedTickets.find((ticket) => ticket.id === activeTicketId)?.priority ??
          tickets.find((ticket) => ticket.id === activeTicketId)?.priority
        }
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

export default MyTicket;
