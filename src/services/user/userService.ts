import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

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

export interface StaffUser {
  id: number;
  fullName: string;
  avatarURL: string | null;
}

const userService = {
  /**
   * Get all staff and admin users for assignment
   */
  getStaffAndAdmins: async (): Promise<StaffUser[]> => {
    const response = await axios.get<ApiResponse<StaffUser[]>>(`${API_BASE_URL}/users/staff-and-admins`);
    return response.data.data; // Extract the data field from the API response
  }
};

export default userService;