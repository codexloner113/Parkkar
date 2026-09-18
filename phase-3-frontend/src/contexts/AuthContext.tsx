"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchMe,
  loginUser,
  registerUser,
  type LoginPayload,
  type RegisterPayload,
  type AuthResult,
} from "@/lib/auth";

import { registerUnauthorizedHandler } from "@/lib/api";
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "@/lib/token";

import { queryKeys } from "@/lib/queryKeys";
import type { User } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResult>;
  register: (
    payload: RegisterPayload,
  ) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

const tokenListeners = new Set<() => void>();

const subscribeToToken = (
  listener: () => void,
) => {
  tokenListeners.add(listener);

  return () => {
    tokenListeners.delete(listener);
  };
};

const getTokenSnapshot = () =>
  getStoredToken();

const getTokenServerSnapshot = () =>
  null;

function notifyTokenChange() {
  tokenListeners.forEach((listener) => {
    listener();
  });
}

function persistToken(token: string) {
  setStoredToken(token);
  notifyTokenChange();
}

function removeToken() {
  clearStoredToken();
  notifyTokenChange();
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  const token = useSyncExternalStore(
    subscribeToToken,
    getTokenSnapshot,
    getTokenServerSnapshot,
  );

  const [loginPending, setLoginPending] =
    useState(false);

  const meQuery = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchMe,
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logout = useCallback(() => {
    removeToken();
    queryClient.clear();
  }, [queryClient]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoginPending(true);

      try {
        const result = await loginUser(payload);

        persistToken(result.data.token);

        queryClient.setQueryData(
          queryKeys.auth.me(),
          {
            success: true,
            message: "Current user.",
            data: result.data.user,
          },
        );

        return result.data;
      } finally {
        setLoginPending(false);
      }
    },
    [queryClient],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setLoginPending(true);

      try {
        const result =
          await registerUser(payload);

        persistToken(result.data.token);

        queryClient.setQueryData(
          queryKeys.auth.me(),
          {
            success: true,
            message: "Current user.",
            data: result.data.user,
          },
        );

        return result.data;
      } finally {
        setLoginPending(false);
      }
    },
    [queryClient],
  );

  const refreshUser = useCallback(
    async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.me(),
      });
    },
    [queryClient],
  );

  useEffect(() => {
    registerUnauthorizedHandler(logout);

    return () =>
      registerUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data?.data ?? null,
      token,
      isAuthenticated: Boolean(
        token && meQuery.data?.data,
      ),
      isLoading:
        loginPending ||
        (!!token && meQuery.isLoading),
      login,
      register,
      logout,
      refreshUser,
    }),
    [
      meQuery.data,
      meQuery.isLoading,
      token,
      loginPending,
      login,
      register,
      logout,
      refreshUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider",
    );
  }

  return context;
}