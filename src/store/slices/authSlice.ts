import { AuthState, UserResponse } from "@/src/features/auth/types/auth";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserResponse; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.isInitialized = true;
      state.error = null;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setUser: (state, action: PayloadAction<UserResponse>) => {
      state.user = action.payload;
    },
    logoutState: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isInitialized = true;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
      state.isLoading = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCredentials,
  setAccessToken,
  setUser,
  logoutState,
  setLoading,
  setInitialized,
  setError,
} = authSlice.actions;

export default authSlice.reducer;
