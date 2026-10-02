import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

const ADMIN_ONLY_PREFIXES = ["/users", "/logs"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAdminRoute = ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAdminRoute && !session.isSuperAdmin) {
    return NextResponse.redirect(new URL("/events", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/events/:path*", "/users/:path*", "/logs/:path*", "/history/:path*"],
};