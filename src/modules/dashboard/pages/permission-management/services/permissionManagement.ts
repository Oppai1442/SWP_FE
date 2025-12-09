import { getData } from "@/services/api/apiService";
import type { ApiResponse, PermissionResponse, RoleResponse } from "../types";

export const getPermissionsAPI = async () => {
  const response = await getData<ApiResponse<PermissionResponse[]>>("/permission");
  return response.data;
};

export const getRolesAPI = async () => {
  const response = await getData<ApiResponse<RoleResponse[]>>("/roles");
  return response.data;
};
