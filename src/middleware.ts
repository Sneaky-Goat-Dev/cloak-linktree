import { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE, generateCsrfToken } from "@/lib/csrf";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|avatar.jpg|og.jpg).*)"],
};

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Hardening headers
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Permissions-Policy", "interest-cohort=()");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");

  // Issue a double-submit CSRF cookie if absent.
  if (!req.cookies.get(CSRF_COOKIE)) {
    res.cookies.set(CSRF_COOKIE, generateCsrfToken(), {
      sameSite: "strict",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false, // needs to be readable by client to echo in header
      maxAge: 60 * 60 * 24,
    });
  }

  return res;
}
