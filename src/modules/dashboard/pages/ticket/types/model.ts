export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
}

export interface TicketAttachment {
  id: number;
  name: string;
  sizeLabel: string;
  url?: string;
  mimeType?: string;
}

export interface TicketUserSummary {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

export interface TicketParticipant extends TicketUserSummary {
  presence: 'online' | 'offline' | 'away';
}

export interface TicketMessage {
  id: number;
  content: string;
  createdAt: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  author: TicketUserSummary;
  attachments: TicketAttachment[];
  imagePreviewUrl?: string;
}

export interface TicketTimelineEvent {
  id: string;
  label: string;
  description?: string;
  icon: 'CREATED' | 'UPDATED' | 'ASSIGNEE' | 'COMMENT' | 'STATUS';
  createdAt: string;
}

export interface TicketSummary {
  id: number;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  shortDescription?: string;
  tags: string[];
}

export interface TicketDetail extends TicketSummary {
  description: string;
  reporter: TicketUserSummary;
  assignee?: TicketUserSummary;
  participants: TicketParticipant[];
  attachments: TicketAttachment[];
  messages: TicketMessage[];
  timeline: TicketTimelineEvent[];
}

export interface TicketListResponse {
  tickets: TicketSummary[];
  stats: TicketStats;
}

export interface CreateTicketMessageRequest {
  content: string;
  isInternal?: boolean;
  attachmentIds?: number[];
  inlineImageBase64?: string;
}
