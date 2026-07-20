"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Attempt to auto-login using cookie refresh rotation
        const response = await api.post("/auth/refresh");
        const { accessToken, user } = response.data.data;
        setAuth(accessToken, user);
      } catch (error) {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setAuth, clearAuth, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
export default AuthProvider;
