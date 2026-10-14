import { apiClient } from "@/src/services/api/apiClient";
import {
  APIResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  UserResponse,
} from "../types/auth";

export const authService = {
  register: async (
    data: RegisterRequest
  ): Promise<APIResponse<UserResponse>> => {
    return apiClient.post<UserResponse>("/auth/register", data);
  },

  login: async (data: LoginRequest): Promise<APIResponse<LoginResponse>> => {
    return apiClient.post<LoginResponse>("/auth/login", data);
  },

  getMe: async (accessToken?: string): Promise<APIResponse<UserResponse>> => {
    return apiClient.get<UserResponse>("/auth/me", accessToken);
  },

  refreshToken: async (): Promise<APIResponse<RefreshTokenResponse>> => {
    return apiClient.post<RefreshTokenResponse>("/auth/refresh");
  },

  logout: async (): Promise<APIResponse<null>> => {
    return apiClient.post<null>("/auth/logout");
  },
};
