import { api } from "@/lib/api";
import type { ApiSuccessResponse } from "@/types/api";
import type { User } from "@/types/user";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export async function fetchMe(): Promise<ApiSuccessResponse<User>> {
  const response = await api.get<ApiSuccessResponse<User>>("/auth/me");
  return response.data;
}

export async function loginUser(payload: LoginPayload): Promise<ApiSuccessResponse<AuthResult>> {
  const response = await api.post<ApiSuccessResponse<AuthResult>>("/auth/login", payload);
  return response.data;
}

export async function registerUser(payload: RegisterPayload): Promise<ApiSuccessResponse<AuthResult>> {
  const response = await api.post<ApiSuccessResponse<AuthResult>>("/auth/register", payload);
  return response.data;
}
