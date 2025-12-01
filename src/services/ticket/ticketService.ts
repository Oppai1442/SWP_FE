import axios from 'axios';
import { Stomp } from '@stomp/stompjs';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
  ?? 'http://localhost:8080/api';

const resolveWebSocketUrl = (path: string, token?: string) => {
  const apiBase = API_BASE_URL;
  const wsBase = apiBase.replace(/^http/i, (match) => (match === 'https' ? 'wss' : 'ws'));
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${wsBase}${normalizedPath}`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
};

// Interface for API response wrapper
export interface ApiResponse<T> {
  status: string;
  code: number;
  message: string;
  timestamp: string;
  requestId: string;
  version: string;
  meta: {
    clientIp: string;
    path: string;
    method: string;
    host: string;
    userAgent: string;
    referer: string;
    traceId: string | null;
    detail: string | null;
  };
  data: T;
}

// Interface definitions for ticket data
export interface TicketDTO {
  id: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string | null;
  userId: number;
  userName: string;
  userEmail: string;
  avtarUrl: string | null;
  assignees: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
  }[];
  comments: {
    id: number;
    content: string;
    createdAt: string;
    userId: number;
    userName: string;
    userEmail: string;
    avatarUrl: string | null;
    attachments: AttachmentDTO[];
    isInternal?: boolean;
  }[];
}

export interface AssigneeDTO {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface CommentDTO {
  id?: number;
  content: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string | null;
  isInternal?: boolean;
  createdAt?: string;
  attachments?: AttachmentDTO[];
}

export interface AttachmentDTO {
  id: number;
  fileName: string;
  fileUrl: string;
  createdAt?: string;
}

export interface CreateTicketRequestDTO {
  userId: number; 
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface TicketFilterOptions {
  page?: number;
  size?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// Ticket service functions
export const ticketService = {
  
  getAllTickets: async (filterOptions: TicketFilterOptions = {}): Promise<PageResponse<TicketDTO>> => {
    const {
      page = 0,
      size = 10,
      status,
      sortBy = 'id',
      sortOrder = 'asc',
      startDate,
      endDate
    } = filterOptions;
    
    // Build query params
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get<ApiResponse<PageResponse<TicketDTO>>>(
      `${API_BASE_URL}/ticket?${params.toString()}`, 
      getAuthHeaders()
    );
    return response.data.data; // Extract the data field from the API response
  },
  
  /**
   * Fetch all tickets for a specific user with pagination, filtering and sorting
   */
  getUserTickets: async (userId: number, filterOptions: TicketFilterOptions = {}): Promise<PageResponse<TicketDTO>> => {
    const {
      page = 0,
      size = 10,
      status,
      sortBy = 'id',
      sortOrder = 'asc',
      startDate,
      endDate
    } = filterOptions;
    
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get<ApiResponse<PageResponse<TicketDTO>>>(`${API_BASE_URL}/ticket/getAllByUserId/${userId}`, { params });
    return response.data.data; 
  },
  
  /**
   * Create a new ticket
   */
  createTicket: async (ticket: CreateTicketRequestDTO): Promise<TicketDTO> => {
    console.log('🔄 Creating ticket:', ticket);
    
    // Validate input
    if (!ticket.subject.trim() || !ticket.description.trim()) {
      throw new Error('Subject and description are required');
    }
    
    const response = await axios.post<ApiResponse<TicketDTO>>(`${API_BASE_URL}/ticket`, ticket);
    console.log('✅ Ticket created response:', response.data);
    return response.data.data; 
  },
  
  getTicketDetails: async (ticketId: number): Promise<TicketDTO> => {
    const response = await axios.get<ApiResponse<TicketDTO>>(`${API_BASE_URL}/ticket/${ticketId}`);
    return response.data.data; // Extract the data field from the API response
  },
  
  connectToTicketChat: (ticketId: number, onMessageReceived: (message: CommentDTO) => void, token?: string) => {
    const socketFactory = () => new WebSocket(resolveWebSocketUrl('/ws', token));

    const client = Stomp.over(socketFactory);
    
    // Giảm log trong production
    if (process.env.NODE_ENV === 'production') {
      client.debug = () => {};
    }
    
    client.connect(
      token ? { Authorization: `Bearer ${token}` } : {},
      () => {
        console.log(`Connected to WebSocket for ticket ${ticketId}`);
        client.subscribe(`/topic/ticket.${ticketId}`, (message) => {
          try {
            const receivedMessage = JSON.parse(message.body);
            onMessageReceived(receivedMessage);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        });
      },
      (error) => {
        console.error('WebSocket connection error:', error);
      }
    );
    
    return client;
  },
  
  /**
   * Send a text message via WebSocket
   */
  sendMessage: (client: any, message: CommentDTO) => {
    if (client && client.connected) {
      client.send("/app/chat.sendMessage", {}, JSON.stringify(message));
    } else {
      console.error('WebSocket client is not connected');
    }
  },
  
  /**
   * Send a message with file attachments
   */
  sendMessageWithAttachments: async (ticketId: number, message: CommentDTO, files: File[]): Promise<CommentDTO> => {
    const formData = new FormData();
    formData.append('message', JSON.stringify(message));
    files.forEach(file => formData.append('files', file));
    
    const response = await axios.post<ApiResponse<CommentDTO>>(`${API_BASE_URL}/ticket/${ticketId}/comments-with-attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data; // Extract the data field from the API response
  },
  
  /**
   * Disconnect from WebSocket
   */
  disconnectWebSocket: (client: any) => {
    if (client && client.connected) {
      client.disconnect();
    }
  },

  /**
   * Update ticket status
   */
  updateTicketStatus: async (ticketId: number, status: 'open' | 'in_progress' | 'closed'): Promise<TicketDTO> => {
    const response = await axios.put<ApiResponse<TicketDTO>>(`${API_BASE_URL}/ticket/${ticketId}`, {
      id: ticketId,
      status
    });
    return response.data.data; // Extract the data field from the API response
  },

  /**
   * Assign staff members to a ticket
   */
  assignStaffToTicket: async (ticketId: number, assigneeIds: number[]): Promise<string> => {
    const response = await axios.post<string>(`${API_BASE_URL}/ticket/assign`, {
      ticketId,
      assigneeIds
    });
    return response.data;
  },

  /**
   * Remove an assignee from a ticket
   */
  removeAssigneeFromTicket: async (ticketId: number, assigneeId: number): Promise<string> => {
    const response = await axios.delete<string>(`${API_BASE_URL}/ticket/${ticketId}/assignee/${assigneeId}`);
    return response.data;
  },
};

// Add a getAuthHeaders utility function
const getAuthHeaders = () => {
  const token = localStorage.getItem('accountToken');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

export default ticketService;
