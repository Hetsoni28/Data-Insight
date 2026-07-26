/**
 * Next.js Edge Middleware — Minimal Auth Routing
 *
 * NOTE: Our auth token lives in localStorage (client-side only),
 * so the middleware cannot read it on the server edge.
 * Client-side route guards in each protected page handle auth redirects.
 *
 * The middleware ONLY handles one case:
 * - Redirect already-authenticated users away from /login and /register
 *   (using the "auth-storage" Zustand persist cookie as a signal)
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes where logged-in users should be redirected to /dashboard
const AUTH_ONLY_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for Zustand persist key in cookies (set by zustand/middleware persist)
  // This is a lightweight signal — actual token validation happens in the API
  const authStorage = request.cookies.get("auth-storage")?.value;
  const isAuthenticated = authStorage
    ? (() => {
        try {
          const parsed = JSON.parse(authStorage);
          return Boolean(parsed?.state?.token);
        } catch {
          return false;
        }
      })()
    : false;

  // Logged-in users hitting login/register → send to dashboard
  if (isAuthenticated && AUTH_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

