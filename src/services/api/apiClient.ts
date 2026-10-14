import { APIResponse } from "@/src/features/auth/types/auth";
import { store } from "@/src/store";
import { logoutState, setAccessToken } from "@/src/store/slices/authSlice";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class APIError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
        }
        store.dispatch(logoutState());
        return null;
      }

      const data = await response.json();
      if (data.success && data.data?.access_token) {
        const token = data.data.access_token as string;
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
        }
        store.dispatch(setAccessToken(token));
        return token;
      }
      store.dispatch(logoutState());
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null,
  isRetry: boolean = false
): Promise<APIResponse<T>> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  // Get active token from argument, Redux store, or localStorage
  let activeToken = token;
  if (!activeToken) {
    activeToken = store.getState().auth.accessToken;
  }
  if (!activeToken && typeof window !== "undefined") {
    activeToken = localStorage.getItem("access_token");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  const config: RequestInit = {
    cache: "no-store",
    ...options,
    headers,
    credentials: "include", // Required for HttpOnly refresh_token cookie
  };

  try {
    const response = await fetch(url, config);
    let responseData: APIResponse<T>;

    try {
      responseData = await response.json();
    } catch {
      throw new APIError(
        `Server returned error ${response.status} (${response.statusText})`,
        response.status
      );
    }

    if (!response.ok || responseData.success === false) {
      // Handle 401 / expired token with automatic silent refresh
      if (
        response.status === 401 &&
        !isRetry &&
        !endpoint.includes("/auth/login") &&
        !endpoint.includes("/auth/register") &&
        !endpoint.includes("/auth/refresh")
      ) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return request<T>(endpoint, options, newToken, true);
        }
      }

      const rawError = responseData as { detail?: string; message?: string; data?: unknown } | null;
      const errorMessage =
        (typeof rawError?.detail === "string" ? rawError.detail : null) ||
        rawError?.message ||
        `Request failed with status ${response.status}`;
      throw new APIError(errorMessage, response.status, rawError?.data || rawError?.detail);
    }

    return responseData;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new APIError(
        "Unable to connect to the server. Please check your network connection.",
        0
      );
    }

    throw new APIError(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}

export const apiClient = {
  get: <T>(endpoint: string, token?: string | null) =>
    request<T>(endpoint, { method: "GET" }, token),

  post: <T>(endpoint: string, body?: unknown, token?: string | null) =>
    request<T>(
      endpoint,
      {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      },
      token
    ),

  put: <T>(endpoint: string, body?: unknown, token?: string | null) =>
    request<T>(
      endpoint,
      {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      },
      token
    ),

  patch: <T>(endpoint: string, body?: unknown, token?: string | null) =>
    request<T>(
      endpoint,
      {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      },
      token
    ),

  delete: <T>(endpoint: string, token?: string | null) =>
    request<T>(endpoint, { method: "DELETE" }, token),
};
