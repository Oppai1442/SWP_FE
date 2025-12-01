
import { postData } from "@/services/api/apiService";
import type { LoginResponse, SignUpResponse } from "@/types/Response";

interface SignInCredentials {
  username: string;
  password: string;
}

export const signIn = async (credentials: SignInCredentials) => {
  try {
    const response = await postData<LoginResponse>("/auth/login", credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
}

interface signUpCredentials {
  email: string;
  username: string,
  password: string;
}

export const signUp = async (credentials: signUpCredentials) => {
  try {
    const response = await postData<SignUpResponse>("/auth/register", credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export const signInWithGoogle = async (token: string) => {
  try {
    const response = await postData<LoginResponse>("/auth/google", { token });
    return response.data;
  } catch (error) {
    throw error;
  }
}
