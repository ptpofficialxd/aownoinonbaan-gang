import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_REFRESH_THRESHOLD_SECONDS,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
} from "@/lib/auth-edge";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth/login",
  "/api/media/",
  "/api/media/upload/",
  "/_next/",
  "/favicon",
  "/icon",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function setNoStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  const target = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  url.pathname = "/login";
  url.search =
    target && target !== "/" ? `?next=${encodeURIComponent(target)}` : "";
  const res = NextResponse.redirect(url);
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return setNoStore(res);
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token).catch(() => null);
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    if (session) {
      const target = req.nextUrl.searchParams.get("next") || "/";
      const url = req.nextUrl.clone();
      url.pathname = target.startsWith("/") ? target : "/";
      url.search = "";
      return setNoStore(NextResponse.redirect(url));
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    return redirectToLogin(req);
  }

  const res = setNoStore(NextResponse.next());
  const now = Math.floor(Date.now() / 1000);

  if (session.exp - now < SESSION_REFRESH_THRESHOLD_SECONDS) {
    const refreshed = await signSession({
      sub: session.sub,
      userId: session.userId,
      name: session.name,
      role: session.role,
    }).catch(() => null);

    if (refreshed) {
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: refreshed,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
      });
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
