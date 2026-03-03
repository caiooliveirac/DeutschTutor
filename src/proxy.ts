import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth";

// Paths that don't require authentication (relative to basePath)
const PUBLIC_PATHS = ["/login", "/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg")
  ) {
    return NextResponse.next();
  }

  // Verify JWT session cookie
  const authenticated = await verifyRequestToken(request);
  if (!authenticated) {
    // For API routes, return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For pages, redirect to login
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const loginUrl = new URL(`${basePath}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match root path AND all sub-paths except _next/static, _next/image, static files
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
