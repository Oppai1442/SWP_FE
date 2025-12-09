export interface PermissionResponse {
  id: number;
  name: string;
  description: string;
}

export interface RoleResponse {
  id: number;
  name: string;
  userCount: number | null;
  createdTime: string | null;
  updatedTime: string | null;
  permissions: PermissionResponse[];
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}
