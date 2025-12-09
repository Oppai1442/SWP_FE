import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  Minus,
  Paperclip,
  Plus,
  Send,
  Smile,
  Users,
  X,
} from 'lucide-react';
import type { TicketDetail, TicketMessage, TicketParticipant } from '../types';
import {
  formatDateLabel,
  formatTimeLabel,
  getInitials,
  getPresenceClass,
  getPriorityMeta,
  getStatusMeta,
  getTimelineMeta,
} from '../utils';

const EMOJIS = Object.freeze([
  '😀',
  '😄',
  '😁',
  '😆',
  '😍',
  '😎',
  '🥳',
  '😭',
  '😡',
  '👍',
  '🙏',
  '🎉',
  '🔥',
  '💡',
  '✅',
  '⚠️',
  '❤️',
]);

type PendingAttachment = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
};

const generateAttachmentId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const isImageLikeFile = (name: string, type?: string): boolean => {
  if (type && type.startsWith('image/')) {
    return true;
  }
  const lower = name.toLowerCase();
  return (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.bmp') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.avif')
  );
};

interface TicketDetailModalProps {
  ticket: TicketDetail | null;
  ticketId?: number | null;
  statusHint?: string | null;
  priorityHint?: string | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSendMessage: (payload: {
    content: string;
    attachments?: File[];
  }) => Promise<void>;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  ticketId,
  statusHint,
  priorityHint,
  isOpen,
  isLoading,
  error,
  onClose,
  onSendMessage,
}) => {
  const [showParticipants, setShowParticipants] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [viewerOffset, setViewerOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsRef = useRef<PendingAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const panStateRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const resetComposer = useCallback(() => {
    setMessageInput('');
    setPendingAttachments((previous) => {
      previous.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
      return [];
    });
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
    setComposerError(null);
    setIsEmojiOpen(false);
    setIsDraggingOver(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetComposer();
      setShowParticipants(false);
      setViewerImage(null);
      setViewerZoom(1);
      setViewerOffset({ x: 0, y: 0 });
      setIsPanning(false);
      panStateRef.current = null;
    }
  }, [isOpen, resetComposer]);

  useEffect(() => {
    if (!ticket?.id) {
      return;
    }
    resetComposer();
  }, [resetComposer, ticket?.id]);

  useEffect(() => {
    attachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(() => () => {
    attachmentsRef.current.forEach((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.messages]);

  useEffect(() => {
    if (!isEmojiOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        !target ||
        emojiPanelRef.current?.contains(target) ||
        emojiButtonRef.current?.contains(target)
      ) {
        return;
      }
      setIsEmojiOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmojiOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (viewerImage) {
          setViewerImage(null);
          setViewerZoom(1);
          event.stopPropagation();
          return;
        }
        if (isEmojiOpen) {
          setIsEmojiOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEmojiOpen, viewerImage]);

  useEffect(() => {
    if (!isPanning) {
      return;
    }
    const handleMouseUp = () => {
      setIsPanning(false);
      panStateRef.current = null;
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchcancel', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchcancel', handleMouseUp);
    };
  }, [isPanning]);

  useEffect(() => {
    if (viewerZoom <= 1) {
      setViewerOffset({ x: 0, y: 0 });
      setIsPanning(false);
      panStateRef.current = null;
    }
  }, [viewerZoom]);

  useEffect(() => {
    if (!viewerImage) {
      setViewerOffset({ x: 0, y: 0 });
      setIsPanning(false);
      panStateRef.current = null;
    }
  }, [viewerImage]);

  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      if (viewerZoom <= 1) {
        return;
      }
      setIsPanning(true);
      panStateRef.current = {
        startX: clientX,
        startY: clientY,
        originX: viewerOffset.x,
        originY: viewerOffset.y,
      };
    },
    [viewerOffset.x, viewerOffset.y, viewerZoom],
  );

  const movePan = useCallback((clientX: number, clientY: number) => {
    if (!panStateRef.current) {
      return;
    }
    const { startX, startY, originX, originY } = panStateRef.current;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    setViewerOffset({ x: originX + deltaX, y: originY + deltaY });
  }, []);

  const endPan = useCallback(() => {
    setIsPanning(false);
    panStateRef.current = null;
  }, []);

  const handleViewerMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      startPan(event.clientX, event.clientY);
    },
    [startPan],
  );

  const handleViewerMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!panStateRef.current) {
        return;
      }
      event.preventDefault();
      movePan(event.clientX, event.clientY);
    },
    [movePan],
  );

  const handleViewerMouseUp = useCallback(() => {
    if (!panStateRef.current) {
      return;
    }
    endPan();
  }, [endPan]);

  const handleViewerMouseLeave = useCallback(() => {
    if (!panStateRef.current) {
      return;
    }
    endPan();
  }, [endPan]);

  const handleViewerTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      if (viewerZoom > 1) {
        event.preventDefault();
      }
      startPan(touch.clientX, touch.clientY);
    },
    [startPan, viewerZoom],
  );

  const handleViewerTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!panStateRef.current) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      event.preventDefault();
      movePan(touch.clientX, touch.clientY);
    },
    [movePan],
  );

  const handleViewerTouchEnd = useCallback(() => {
    if (!panStateRef.current) {
      return;
    }
    endPan();
  }, [endPan]);

  const statusMeta = useMemo(
    () => getStatusMeta(ticket?.status ?? statusHint),
    [statusHint, ticket?.status],
  );
  const priorityMeta = useMemo(
    () => getPriorityMeta(ticket?.priority ?? priorityHint),
    [priorityHint, ticket?.priority],
  );

  const handleToggleParticipants = () => {
    setShowParticipants((previous) => !previous);
  };

  const addAttachments = useCallback((files: FileList | File[] | null) => {
    if (!files) {
      return;
    }
    const fileArray = Array.from(files).filter((file): file is File => file instanceof File);
    if (fileArray.length === 0) {
      return;
    }

    setPendingAttachments((previous) => {
      const existingKeys = new Set(
        previous.map((item) => `${item.name}-${item.size}-${item.file.lastModified}`),
      );
      const next = [...previous];

      fileArray.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (existingKeys.has(key)) {
          return;
        }

        const previewUrl = isImageLikeFile(file.name, file.type)
          ? URL.createObjectURL(file)
          : undefined;
        next.push({
          id: generateAttachmentId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl,
        });
        existingKeys.add(key);
      });

      return next;
    });
    setIsEmojiOpen(false);
    textareaRef.current?.focus();
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((previous) => {
      const target = previous.find((attachment) => attachment.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return previous.filter((attachment) => attachment.id !== id);
    });
  }, []);

  const handleAttachmentInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    addAttachments(event.target.files);
    event.target.value = '';
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (Array.from(event.dataTransfer.types).includes('Files')) {
      event.dataTransfer.dropEffect = 'copy';
      setIsDraggingOver(true);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (Array.from(event.dataTransfer.types).includes('Files')) {
      event.dataTransfer.dropEffect = 'copy';
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const related = event.relatedTarget as Node | null;
    if (!related || !event.currentTarget.contains(related)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    if (event.dataTransfer?.files?.length) {
      addAttachments(event.dataTransfer.files);
    }
  };

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = messageInput.trim();
    const hasAttachments = pendingAttachments.length > 0;
    const hasMessage = trimmedMessage.length > 0;

    if (!ticket || (!hasMessage && !hasAttachments)) {
      return;
    }
    setIsSending(true);
    setComposerError(null);
    try {
      await onSendMessage({
        content: trimmedMessage,
        attachments: pendingAttachments.map((attachment) => attachment.file),
      });
      resetComposer();
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to send message. Please try again.';
      setComposerError(message);
    } finally {
      setIsSending(false);
    }
  }, [messageInput, onSendMessage, pendingAttachments, resetComposer, ticket]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (!items) {
      return;
    }

    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (!file) {
          continue;
        }
        if (item.type.startsWith('image/')) {
          event.preventDefault();
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              setInlineImage(reader.result);
            }
          };
          reader.readAsDataURL(file);
          setIsEmojiOpen(false);
          break;
        }
        event.preventDefault();
        addAttachments([file]);
        break;
      }
    }
  };

  const renderParticipantAvatar = (participant: TicketParticipant) => {
    const initials = getInitials(participant.name);
    return (
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-xs font-medium">
          {initials}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${getPresenceClass(
            participant.presence,
          )}`}
        />
      </div>
    );
  };

  const renderMessageStatus = (message: TicketMessage) => {
    if (message.status === 'READ') {
      return <CheckCheck className="w-3 h-3 text-cyan-400" />;
    }
    if (message.status === 'DELIVERED') {
      return <CheckCheck className="w-3 h-3 text-gray-500" />;
    }
    return <Check className="w-3 h-3 text-gray-500" />;
  };

  const renderMessageImage = (message: TicketMessage) => {
    const fallbackAttachment = message.attachments.find((attachment) => {
      if (!attachment.url) return false;
      if (attachment.mimeType?.startsWith('image/')) return true;
      const name = attachment.name?.toLowerCase() ?? '';
      return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name);
    });
    const preview =
      message.imagePreviewUrl ?? fallbackAttachment?.url ?? null;

    if (!preview) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={() => {
          setViewerImage(preview);
          setViewerZoom(1);
        }}
        className="w-full mb-2 block focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg overflow-hidden"
      >
        <img
          src={preview}
          alt={fallbackAttachment?.name ?? 'Uploaded'}
          className="w-full rounded-lg max-h-48 object-cover"
          loading="lazy"
        />
      </button>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-7xl h-[90vh] bg-gray-900 rounded-2xl border border-gray-800/50 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50 bg-gray-800/30">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-light">
              Ticket {ticketId ?? ticket?.id ? `#${ticketId ?? ticket?.id}` : ''}
            </h2>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${statusMeta.className}`}
            >
              <statusMeta.Icon className="w-4 h-4" />
              {statusMeta.label}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${priorityMeta.className}`}
            >
              {priorityMeta.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Loading ticket details...
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
              <p className="text-gray-300 text-sm">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          ) : !ticket ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Ticket details are not available.
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h3 className="text-3xl font-light mb-2">{ticket.subject}</h3>
                  <p className="text-gray-400">{ticket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {ticket.assignee && (
                    <div className="backdrop-blur-xl bg-gray-800/20 border border-gray-800/50 rounded-xl p-4">
                      <div className="text-gray-400 text-sm mb-1">Assignee</div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-sm font-medium">
                          {getInitials(ticket.assignee.name)}
                        </div>
                        <div>
                          <div className="text-white">{ticket.assignee.name}</div>
                          {ticket.assignee.role && (
                            <div className="text-gray-500 text-xs">
                              {ticket.assignee.role}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="backdrop-blur-xl bg-gray-800/20 border border-gray-800/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Reporter</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-sm font-medium">
                        {getInitials(ticket.reporter?.name)}
                      </div>
                      <div>
                        <div className="text-white">{ticket.reporter?.name}</div>
                        {ticket.reporter?.role && (
                          <div className="text-gray-500 text-xs">
                            {ticket.reporter.role}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-gray-800/20 border border-gray-800/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Created</div>
                    <div className="text-white">
                      {formatDateLabel(ticket.createdAt, true)}
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-gray-800/20 border border-gray-800/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Last Updated</div>
                    <div className="text-white">
                      {formatDateLabel(ticket.updatedAt, true)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 text-sm mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.length === 0 ? (
                      <span className="text-gray-500 text-xs">No tags assigned</span>
                    ) : (
                      ticket.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-800/30 border border-gray-700/50 rounded-full text-sm text-gray-300"
                        >
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {ticket.attachments.length > 0 && (
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Attachments</div>
                    <div className="space-y-2">
                      {ticket.attachments.map((file) => (
                        <a
                          key={file.id}
                          href={file.url ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-800/30 border border-gray-700/50 rounded-xl hover:bg-gray-800/50 transition-colors duration-200"
                        >
                          <Paperclip className="w-5 h-5 text-cyan-400" />
                          <div className="flex-1">
                            <div className="text-white text-sm">{file.name}</div>
                            <div className="text-gray-500 text-xs">{file.sizeLabel}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-gray-400 text-sm mb-4">Activity Timeline</div>
                  <div className="space-y-4">
                    {ticket.timeline.length === 0 ? (
                      <div className="text-gray-500 text-xs">No activity recorded yet.</div>
                    ) : (
                      ticket.timeline.map((event) => {
                        const timelineMeta = getTimelineMeta(event.icon);
                        const TimelineIcon = timelineMeta.Icon;
                        return (
                          <div className="flex gap-3" key={event.id}>
                            <div
                              className={`w-8 h-8 rounded-full ${timelineMeta.circleClass} flex items-center justify-center flex-shrink-0`}
                            >
                              <TimelineIcon
                                className={`w-4 h-4 ${timelineMeta.iconClass}`}
                              />
                            </div>
                            <div>
                              <div className="text-white text-sm">{event.label}</div>
                              {event.description && (
                                <div className="text-gray-500 text-xs mb-1">
                                  {event.description}
                                </div>
                              )}
                              <div className="text-gray-500 text-xs">
                                {formatDateLabel(event.createdAt, true)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="w-[450px] border-l border-gray-800/50 flex flex-col bg-gray-900/50">
                <div className="p-4 border-b border-gray-800/50 bg-gray-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-light">Discussion</h3>
                    <button
                      onClick={handleToggleParticipants}
                      className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 relative"
                    >
                      <Users className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full text-xs flex items-center justify-center text-gray-900">
                        {ticket.participants.length}
                      </span>
                    </button>
                  </div>

                  {showParticipants && (
                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                      {ticket.participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors duration-200"
                        >
                          {renderParticipantAvatar(participant)}
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm truncate">
                              {participant.name}
                            </div>
                            {participant.role && (
                              <div className="text-gray-500 text-xs">
                                {participant.role}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {ticket.messages.map((message) => (
                    <div key={message.id} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {getInitials(message.author?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white text-sm font-medium">
                            {message.author?.name ?? 'Unknown'}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {formatTimeLabel(message.createdAt)}
                          </span>
                          {renderMessageStatus(message)}
                        </div>
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl rounded-tl-none p-3">
                          {renderMessageImage(message)}
                          {message.content && (
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                          )}

                          {message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment) => (
                                <a
                                  key={attachment.id}
                                  href={attachment.url ?? '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  {attachment.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div
                  className={`p-4 border-t border-gray-800/50 bg-gray-800/30 transition-colors duration-150 ${
                    isDraggingOver ? 'border-cyan-400/40 bg-cyan-400/10 border-dashed' : ''
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {pendingAttachments.length > 0 && (
                    <div className="mb-3 max-h-40 overflow-y-auto pr-1 space-y-2">
                      {pendingAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 rounded-xl border border-gray-700/60 bg-gray-800/40 px-3 py-2"
                        >
                          {attachment.previewUrl ? (
                            <img
                              src={attachment.previewUrl}
                              alt={attachment.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-800/70 flex items-center justify-center">
                              <Paperclip className="w-4 h-4 text-cyan-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-200 truncate">{attachment.name}</div>
                            <div className="text-[11px] text-gray-500">{formatFileSize(attachment.size)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors duration-150"
                            aria-label="Remove attachment"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={attachmentInputRef}
                      multiple
                      onChange={handleAttachmentInputChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      className="h-12 w-12 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors duration-200 flex items-center justify-center"
                      aria-label="Attach files"
                    >
                      <Paperclip className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="relative">
                      <button
                        ref={emojiButtonRef}
                        type="button"
                        onClick={() => {
                          setIsEmojiOpen((previous) => !previous);
                          textareaRef.current?.focus();
                        }}
                        className={`h-12 w-12 rounded-lg border border-gray-700/50 transition-colors duration-200 flex items-center justify-center ${
                          isEmojiOpen ? 'bg-gray-700/60' : 'bg-gray-800/50 hover:bg-gray-700/50'
                        }`}
                        aria-label="Insert emoji"
                      >
                        <Smile className="w-5 h-5 text-gray-400" />
                      </button>
                      {isEmojiOpen && (
                        <div
                          ref={emojiPanelRef}
                          className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 bg-gray-900 border border-gray-700/60 rounded-xl shadow-xl p-3 w-52 grid grid-cols-6 gap-2"
                        >
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="text-xl hover:scale-110 transition-transform"
                              onClick={() => {
                                setMessageInput((previous) => `${previous}${emoji}`);
                                setIsEmojiOpen(false);
                                textareaRef.current?.focus();
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        value={messageInput}
                        onChange={(event) => setMessageInput(event.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder="Type your message or drop files here..."
                        rows={1}
                        ref={textareaRef}
                        className="w-full px-4 py-3 min-h-[3rem] bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-all duration-300 resize-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSendMessage()}
                      disabled={
                        isSending
                        || (!messageInput.trim() && pendingAttachments.length === 0)
                      }
                      className="h-12 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                      aria-label="Send message"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  {isDraggingOver && (
                    <div
                      className="mt-2 rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-200"
                      role="status"
                    >
                      Drop files here to attach them to your message (max 40 MB each)
                    </div>
                  )}
                  <div className="text-gray-500 text-xs mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                  {composerError && (
                    <div className="text-red-300 text-xs mt-2">{composerError}</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {viewerImage && (
        <div className="fixed inset-0 z-[9999] flex flex-col">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => {
              setViewerImage(null);
              setViewerZoom(1);
              setViewerOffset({ x: 0, y: 0 });
              endPan();
            }}
          />
          <div
            className="relative z-10 flex-1 flex items-center justify-center p-8 overflow-hidden"
            onMouseDown={handleViewerMouseDown}
            onMouseMove={handleViewerMouseMove}
            onMouseUp={handleViewerMouseUp}
            onMouseLeave={handleViewerMouseLeave}
            onTouchStart={handleViewerTouchStart}
            onTouchMove={handleViewerTouchMove}
            onTouchEnd={handleViewerTouchEnd}
            onTouchCancel={handleViewerTouchEnd}
          >
            <img
              src={viewerImage}
              alt="Preview"
              className="max-h-full max-w-full object-contain transition-transform duration-200 select-none"
              draggable={false}
              style={{
                transform: `translate(${viewerOffset.x}px, ${viewerOffset.y}px) scale(${viewerZoom})`,
                cursor: viewerZoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
              }}
            />
            <button
              type="button"
              onClick={() => {
                setViewerImage(null);
                setViewerZoom(1);
                setViewerOffset({ x: 0, y: 0 });
                endPan();
              }}
              className="absolute top-6 right-6 h-10 w-10 rounded-full bg-black/70 hover:bg-black/80 flex items-center justify-center text-white transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative z-10 flex items-center justify-center gap-4 pb-8">
            <button
              type="button"
              onClick={() =>
                setViewerZoom((previous) => Math.max(0.5, Number((previous - 0.25).toFixed(2))))
              }
              className="h-10 w-10 rounded-full bg-gray-900/80 border border-gray-700/60 text-white flex items-center justify-center hover:bg-gray-800/70 transition-colors duration-150"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-gray-200 text-sm w-16 text-center">
              {(viewerZoom * 100).toFixed(0)}%
            </span>
            <button
              type="button"
              onClick={() =>
                setViewerZoom((previous) => Math.min(3, Number((previous + 0.25).toFixed(2))))
              }
              className="h-10 w-10 rounded-full bg-gray-900/80 border border-gray-700/60 text-white flex items-center justify-center hover:bg-gray-800/70 transition-colors duration-150"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailModal;
