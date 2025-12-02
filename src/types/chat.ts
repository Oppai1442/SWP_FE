export interface ChatMessage {
  id?: number;
  ticketId: number;
  senderId: number;
  content: string;
  timestamp: string;
  isInternal?: boolean;
  senderName?: string;
  senderAvatarUrl?: string;
}

export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export interface CommentResponse extends ChatMessage {
  attachments?: Attachment[];
}

export interface TicketChatInfo {
  ticketId: number;
  title: string;
  assignees: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string;
  }[];
  status: string;
}

export interface TicketRefreshEvent {
  ticketId: number;
  eventType: 'NEW_COMMENT' | 'NEW_ATTACHMENT' | 'COMMENT_WITH_ATTACHMENT' | 'COMMENT_UPDATED';
  message: string;
  senderId: number;
  senderName: string;
  timestamp: number;
}