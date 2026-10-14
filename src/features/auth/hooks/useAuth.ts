"use client";

import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  logoutState,
  setCredentials,
  setError,
  setInitialized,
  setLoading,
} from "@/src/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { authService } from "../services/authService";
import { LoginRequest, RegisterRequest } from "../types/auth";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading, isInitialized, error } =
    useAppSelector((state) => state.auth);

  const [formError, setFormError] = useState<string | null>(null);
  const isInitializingRef = useRef(false);

  // Restore session via local token or refresh cookie on page load / mount
  const restoreSession = useCallback(async () => {
    if (isInitialized || isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;

      // 1. First try existing stored token
      if (storedToken) {
        try {
          const meRes = await authService.getMe(storedToken);
          if (meRes.success && meRes.data) {
            dispatch(
              setCredentials({
                user: meRes.data,
                accessToken: storedToken,
              })
            );
            return;
          }
        } catch {
          // Token expired, proceed to refresh token
        }
      }

      // 2. Fallback to HttpOnly refresh token cookie
      const refreshRes = await authService.refreshToken();
      if (refreshRes.success && refreshRes.data?.access_token) {
        const token = refreshRes.data.access_token;
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
        }
        const meRes = await authService.getMe(token);
        if (meRes.success && meRes.data) {
          dispatch(
            setCredentials({
              user: meRes.data,
              accessToken: token,
            })
          );
          return;
        }
      }

      // Both failed: clear token and mark initialized
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
      }
      dispatch(setInitialized());
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
      }
      dispatch(setInitialized());
    } finally {
      isInitializingRef.current = false;
    }
  }, [dispatch, isInitialized]);

  useEffect(() => {
    if (!isInitialized && !isAuthenticated) {
      restoreSession();
    }
  }, [isInitialized, isAuthenticated, restoreSession]);

  const clearAuthError = () => {
    setFormError(null);
    dispatch(setError(null));
  };

  const registerUser = async (data: RegisterRequest): Promise<boolean> => {
    clearAuthError();
    dispatch(setLoading(true));

    try {
      const response = await authService.register(data);
      dispatch(setLoading(false));

      if (response.success) {
        router.push("/sign-in?registered=true");
        return true;
      } else {
        const msg = response.message || "Registration failed";
        setFormError(msg);
        dispatch(setError(msg));
        return false;
      }
    } catch (err: unknown) {
      dispatch(setLoading(false));
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during sign up.";
      setFormError(message);
      dispatch(setError(message));
      return false;
    }
  };

  const loginUser = async (data: LoginRequest): Promise<boolean> => {
    clearAuthError();
    dispatch(setLoading(true));

    try {
      const response = await authService.login(data);

      if (response.success && response.data) {
        const { access_token, user } = response.data;
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", access_token);
        }
        dispatch(
          setCredentials({
            user,
            accessToken: access_token,
          })
        );
        router.push("/dashboard");
        return true;
      } else {
        dispatch(setLoading(false));
        const msg = response.message || "Login failed";
        setFormError(msg);
        dispatch(setError(msg));
        return false;
      }
    } catch (err: unknown) {
      dispatch(setLoading(false));
      const message =
        err instanceof Error ? err.message : "Invalid email or password.";
      setFormError(message);
      dispatch(setError(message));
      return false;
    }
  };

  const logoutUser = async () => {
    dispatch(setLoading(true));
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors and reset local state anyway
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
      }
      dispatch(logoutState());
      router.push("/sign-in");
    }
  };

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    isInitialized,
    error: formError || error,
    registerUser,
    loginUser,
    logoutUser,
    clearAuthError,
  };
}
