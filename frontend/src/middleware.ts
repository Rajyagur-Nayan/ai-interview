import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get("refreshToken")?.value;
  console.log("Middleware refresh token:", refreshToken);
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/interview") ||
    pathname.startsWith("/admin");

  if (isProtectedRoute && !refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && refreshToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/interview/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
