export interface UserResponse {
  id: string;
  email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}
