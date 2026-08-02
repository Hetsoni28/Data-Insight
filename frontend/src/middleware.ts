import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that should bypass this middleware completely
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/onboarding",
]

/**
 * Basic Edge-compatible JWT Decoder.
 * We only need to read the payload, no need to verify the signature here
 * because the Backend and AuthProvider already verify it.
 */
function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Allow public routes and invites
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/invite/")) {
    return NextResponse.next()
  }

  // Get the token from cookies
  const token = request.cookies.get("access_token")?.value

  if (!token) {
    // If they try to access a protected route without a token, Next.js Middleware redirects to /login
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || 
        pathname.startsWith("/owner") || pathname.startsWith("/organization-admin") ||
        pathname.startsWith("/manager") || pathname.startsWith("/analyst") || pathname.startsWith("/viewer")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }

  // Decode the token to find the role
  const payload = decodeJwtPayload(token)
  
  if (!payload || !payload.role) {
    // If the token is invalid or missing a role, force them to re-login
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("access_token")
    return response
  }

  let role = payload.role.toLowerCase()
  if (role === "org_admin") {
    role = "organization-admin"
  }

  // Define the valid roles that map to our folder structure
  const validRoles = ["owner", "organization-admin", "manager", "analyst", "viewer"]
  
  // If their role is completely unrecognized, kick them to login
  if (!validRoles.includes(role)) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("access_token")
    return response
  }

  // Ensure they don't manually access another role's dashboard directly
  const rolePaths = ["/owner", "/organization-admin", "/manager", "/analyst", "/viewer"]
  
  for (const rPath of rolePaths) {
    if (pathname.startsWith(rPath)) {
      if (`/${role}` !== rPath) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      return NextResponse.next()
    }
  }

  // ── Rewrite logic for /dashboard ──────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    // e.g. /dashboard/users -> /owner/dashboard/users
    // We rewrite the URL internally. The user still sees /dashboard/...
    const url = request.nextUrl.clone()
    
    // Replace "/dashboard" with `/${role}/dashboard`
    url.pathname = pathname.replace("/dashboard", `/${role}/dashboard`)
    
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg (favicon files)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg).*)',
  ],
}
