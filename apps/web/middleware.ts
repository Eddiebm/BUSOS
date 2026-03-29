import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "busos-secret-key-change-in-production-32chars!!"
);
const COOKIE_NAME = "busos_session";
const NDA_COOKIE = "busos_nda_accepted";

// Routes that don't need auth
const PUBLIC_PATHS = [
  "/nda",
  "/demo",
  "/sign-in",
  "/sign-up",
  "/api/auth",
  "/api/demo",
  "/api/webhooks",
  "/api/investor",
  "/investor/rooms",
  "/_next",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (pathname.includes(".") && !pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // NDA gate (skip for public paths and API routes)
  const isNdaExempt =
    isPublic(pathname) ||
    pathname.startsWith("/api") ||
    pathname.includes(".");

  if (!isNdaExempt) {
    const accepted = request.cookies.get(NDA_COOKIE)?.value;
    if (!accepted) {
      const nextUrl = new URL("/nda", request.url);
      nextUrl.searchParams.set("next", pathname || "/");
      return NextResponse.redirect(nextUrl);
    }
  }

  // Auth gate for protected **pages** only. API routes must handle auth and return JSON
  // (401/403/404) instead of an HTML redirect — otherwise clients and E2E see 200 after redirect.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!isPublic(pathname)) {
    const authed = await isAuthenticated(request);
    if (!authed) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
