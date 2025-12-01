import api from '../../configs/api';
import type { ChatMessage, CommentResponse, TicketChatInfo } from '../../types/chat';

export const chatService = {
  // Get chat history for a ticket
  async getChatHistory(ticketId: number): Promise<CommentResponse[]> {
    try {
      const response = await api.get(`/api/ticket/${ticketId}/comments`);
      return response?.data.data || [];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },

  // Unified method for sending message with or without attachments
  async sendMessage(message: ChatMessage, files: File[] = []): Promise<CommentResponse> {
    try {
      const formData = new FormData();
      
      // Prepare message data
      const messageData = {
        ticketId: message.ticketId,
        senderId: message.senderId,
        content: message.content || "", // Allow empty content if there are files
        timestamp: new Date().toISOString(),
        isInternal: message.isInternal || false,
        senderName: message.senderName,
        senderAvatarUrl: message.senderAvatarUrl
      };
      
      // Add message data
      formData.append('message', JSON.stringify(messageData));
      
      // Add files if any
      if (files && files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
      }
      
      console.log('📤 Sending message:', { 
        ticketId: message.ticketId, 
        hasContent: !!message.content?.trim(),
        filesCount: files.length 
      });
      
      const response = await api.post(
        `/api/ticket/${message.ticketId}/comment`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response?.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  async getTicketChatInfo(ticketId: number): Promise<TicketChatInfo> {
    try {
      const response = await api.get(`/api/ticket/${ticketId}/chat-info`);
      return response?.data;
    } catch (error) {
      console.error('Error fetching ticket chat info:', error);
      throw error;
    }
  }
};