import type { LoginResponse } from "@/types/Response";
import { postData } from "../api/apiService";
import type { User } from "@/types/Model";

export const fetchUserFromToken = async (token: string): Promise<User | null> => {
  try {
    const response = await postData<LoginResponse>("/auth/me", { token });
    return response.data?.user ?? null;
  } catch (error) {
    throw error;
  }
};


