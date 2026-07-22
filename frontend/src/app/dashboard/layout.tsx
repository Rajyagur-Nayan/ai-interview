import React from "react";
import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["candidate", "admin"]}>
      {children}
    </AuthGuard>
  );
}
