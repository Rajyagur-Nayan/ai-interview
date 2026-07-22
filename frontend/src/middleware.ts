import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Authentication is now performed client-side via backend verification (AuthGuard)
  // to avoid cross-domain cookie isolation between Vercel and Render.
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
