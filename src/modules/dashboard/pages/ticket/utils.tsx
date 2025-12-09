import type { LucideIcon } from 'lucide-react';
import type {
  TicketAttachment,
  TicketDetail,
  TicketMessage,
} from './types';
import type { AttachmentDTO, CommentDTO } from '@/services/ticket/ticketService';
import {
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  Flag,
  MessageCircle,
  PauseCircle,
  RefreshCw,
  Users,
} from 'lucide-react';

const STATUS_META: Record<
  string,
  { label: string; className: string; Icon: LucideIcon }
> = {
  OPEN: {
    label: 'Open',
    className: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    Icon: AlertCircle,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    Icon: Clock,
  },
  ON_HOLD: {
    label: 'On Hold',
    className: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Icon: PauseCircle,
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    Icon: CheckCircle,
  },
  CLOSED: {
    label: 'Closed',
    className: 'text-green-400 bg-green-400/10 border-green-400/20',
    Icon: CheckCircle,
  },
};

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  CRITICAL: {
    label: 'Critical',
    className: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
  HIGH: {
    label: 'High',
    className: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  },
  LOW: {
    label: 'Low',
    className: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
};

const TIMELINE_META: Record<
  string,
  { Icon: LucideIcon; circleClass: string; iconClass: string }
> = {
  CREATED: {
    Icon: CheckCircle,
    circleClass: 'bg-cyan-400/20 border-cyan-400/50',
    iconClass: 'text-cyan-400',
  },
  UPDATED: {
    Icon: RefreshCw,
    circleClass: 'bg-purple-400/20 border-purple-400/50',
    iconClass: 'text-purple-400',
  },
  ASSIGNEE: {
    Icon: Users,
    circleClass: 'bg-blue-400/20 border-blue-400/50',
    iconClass: 'text-blue-400',
  },
  COMMENT: {
    Icon: MessageCircle,
    circleClass: 'bg-emerald-400/20 border-emerald-400/50',
    iconClass: 'text-emerald-400',
  },
  STATUS: {
    Icon: Flag,
    circleClass: 'bg-amber-400/20 border-amber-400/50',
    iconClass: 'text-amber-400',
  },
};

const PRESENCE_CLASS: Record<string, string> = {
  ONLINE: 'bg-green-400',
  AWAY: 'bg-yellow-400',
  OFFLINE: 'bg-gray-500',
};

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
let attachmentKeyCounter = 0;
let messageKeyCounter = 0;

const toDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatWithOptions = (
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
): string => {
  const date = toDate(value ?? null);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const formatDateLabel = (
  value: string | null | undefined,
  includeTime = false,
): string => {
  return formatWithOptions(value, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  });
};

export const formatTimeLabel = (
  value: string | null | undefined,
): string => {
  return formatWithOptions(value, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getInitials = (name?: string | null): string => {
  if (!name) return '??';
  const segments = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!segments.length) return '??';
  return segments.map((segment) => segment.charAt(0).toUpperCase()).join('');
};

const normalizeKey = (value?: string | null): string => {
  return value ? value.replace(/[\s-]+/g, '_').toUpperCase() : '';
};

export const getStatusMeta = (status?: string | null) => {
  const key = normalizeKey(status);
  return STATUS_META[key] ?? STATUS_META.OPEN;
};

export const getPriorityMeta = (priority?: string | null) => {
  const key = normalizeKey(priority);
  return (
    PRIORITY_META[key] ?? {
      label: 'Unknown',
      className: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    }
  );
};

export const getPresenceClass = (presence?: string | null) => {
  const key = normalizeKey(presence);
  return PRESENCE_CLASS[key] ?? 'bg-gray-500';
};

export const getTimelineMeta = (type?: string | null) => {
  const key = normalizeKey(type);
  return (
    TIMELINE_META[key] ?? {
      Icon: Check,
      circleClass: 'bg-gray-400/20 border-gray-400/50',
      iconClass: 'text-gray-400',
    }
  );
};

export const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const maybeResponse = (error as { response?: { data?: unknown } }).response;
    if (maybeResponse?.data) {
      const data = maybeResponse.data as {
        message?: string;
        error?: string;
        detail?: string;
        title?: string;
        meta?: { detail?: string };
      };

      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error;
      }
      if (typeof data.detail === 'string' && data.detail.trim()) {
        return data.detail;
      }
      if (typeof data.title === 'string' && data.title.trim()) {
        return data.title;
      }
      if (typeof data.meta?.detail === 'string' && data.meta.detail.trim()) {
        return data.meta.detail;
      }
      if (typeof maybeResponse.data === 'string') {
        return maybeResponse.data;
      }
    }

    if ('message' in error && typeof (error as { message?: string }).message === 'string') {
      return (error as { message?: string }).message as string;
    }
  }

  return fallback;
};

export const ensureAbsoluteUrl = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (!API_BASE_URL) {
    return value.startsWith('/') ? value : `/${value}`;
  }

  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const originMatch = base.match(/^https?:\/\/[^/]+/i);
  const origin = originMatch ? originMatch[0] : base;

  if (value.startsWith(base)) {
    return value;
  }

  if (value.startsWith(origin)) {
    return value;
  }

  if (value.startsWith('/')) {
    if (value.startsWith('/api/') && base.endsWith('/api')) {
      return `${origin}${value}`;
    }
    return `${base}${value}`;
  }

  if (value.startsWith('api/')) {
    if (base.endsWith('/api')) {
      return `${origin}/${value}`;
    }
    return `${base}/${value}`;
  }

  return `${base}/${value}`;
};

export const inferMimeType = (name?: string | null): string | undefined => {
  if (!name) return undefined;
  const normalized = name.toLowerCase();
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) return 'image/jpeg';
  if (normalized.endsWith('.gif')) return 'image/gif';
  if (normalized.endsWith('.webp')) return 'image/webp';
  if (normalized.endsWith('.bmp')) return 'image/bmp';
  if (normalized.endsWith('.svg')) return 'image/svg+xml';
  if (normalized.endsWith('.pdf')) return 'application/pdf';
  if (normalized.endsWith('.txt')) return 'text/plain';
  if (normalized.endsWith('.zip')) return 'application/zip';
  return undefined;
};

export const isImageAttachment = (attachment: TicketAttachment): boolean => {
  if (!attachment) return false;
  if (attachment.mimeType?.startsWith('image/')) return true;
  const name = attachment.name?.toLowerCase() ?? '';
  return /(\.(png|jpe?g|gif|webp|bmp|svg|avif))$/.test(name);
};

export const enhanceAttachment = (attachment: TicketAttachment): TicketAttachment => {
  return {
    ...attachment,
    url: ensureAbsoluteUrl(attachment.url),
    mimeType: attachment.mimeType ?? inferMimeType(attachment.name),
  };
};

export const enhanceMessage = (message: TicketMessage): TicketMessage => {
  const attachments = (message.attachments ?? []).map(enhanceAttachment);
  const preview =
    ensureAbsoluteUrl(message.imagePreviewUrl) ??
    attachments.find((attachment) => attachment.url && isImageAttachment(attachment))?.url;

  return {
    ...message,
    attachments,
    imagePreviewUrl: preview,
  };
};

export const attachmentFromDto = (attachment: AttachmentDTO): TicketAttachment =>
  enhanceAttachment({
    id: attachment.id ?? ++attachmentKeyCounter,
    name: attachment.fileName ?? 'attachment',
    url: attachment.fileUrl ?? undefined,
    sizeLabel: '--',
  });

export const convertCommentToMessage = (
  comment: CommentDTO,
  currentUserId: number | null,
): TicketMessage => {
  const attachments = (comment.attachments ?? []).map(attachmentFromDto);
  const baseMessage: TicketMessage = {
    id: comment.id ?? ++messageKeyCounter,
    content: comment.content ?? '',
    createdAt: comment.createdAt ?? new Date().toISOString(),
    status:
      comment.userId && currentUserId && comment.userId === currentUserId ? 'SENT' : 'READ',
    author: {
      id: comment.userId ?? 0,
      name: comment.userName ?? 'Unknown User',
      email: comment.userEmail ?? '',
      avatarUrl: comment.avatarUrl ?? undefined,
      role: comment.isInternal ? 'Internal' : 'Collaborator',
    },
    attachments,
  };

  return enhanceMessage(baseMessage);
};

export const truncateText = (
  value: string | null | undefined,
  length = 140,
): string | undefined => {
  if (!value) return undefined;
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
};

const getAttachmentKey = (attachment: TicketAttachment, fallback: string): string | number => {
  return attachment.id ?? attachment.url ?? attachment.name ?? fallback;
};

export const mergeAttachments = (
  existing: TicketAttachment[],
  additional: TicketAttachment[],
): TicketAttachment[] => {
  const seen = new Set<string | number>();
  const merged: TicketAttachment[] = [];

  const push = (source: TicketAttachment[]) => {
    for (const attachment of source) {
      const fallback = `extra-${attachmentKeyCounter += 1}`;
      const key = getAttachmentKey(attachment, fallback);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(attachment);
    }
  };

  push(existing);
  push(additional);
  return merged;
};

export const enhanceTicketDetail = (detail: TicketDetail): TicketDetail => {
  const attachments = (detail.attachments ?? []).map(enhanceAttachment);
  const messages = (detail.messages ?? []).map(enhanceMessage);
  return {
    ...detail,
    attachments,
    messages,
    timeline: detail.timeline ?? [],
  };
};
