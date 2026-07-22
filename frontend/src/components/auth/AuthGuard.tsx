"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ("candidate" | "admin")[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setAuth, clearAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        const response = await api.get("/auth/me");
        const userData = response.data?.data?.user;

        if (userData && isMounted) {
          const currentAccessToken = useAuthStore.getState().accessToken;
          setAuth(currentAccessToken || "", userData);

          // Role enforcement if allowedRoles is specified
          if (allowedRoles && !allowedRoles.includes(userData.role)) {
            if (userData.role === "admin") {
              router.push("/admin");
            } else {
              router.push("/dashboard");
            }
            return;
          }

          setIsAuthenticated(true);
        } else if (isMounted) {
          clearAuth();
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      } catch (error) {
        if (isMounted) {
          clearAuth();
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router, setAuth, clearAuth, allowedRoles]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-neutral-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-sm font-medium text-neutral-600">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default AuthGuard;
