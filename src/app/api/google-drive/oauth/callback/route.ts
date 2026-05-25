import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  exchangeCodeForRefreshToken,
  GOOGLE_DRIVE_STATE_COOKIE,
  saveGoogleDriveRefreshToken,
} from "@/lib/drive";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.role !== "admin") {
    return NextResponse.redirect(new URL("/?drive=forbidden", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const jar = await cookies();
  const storedState = jar.get(GOOGLE_DRIVE_STATE_COOKIE)?.value;

  if (error) {
    return NextResponse.redirect(
      new URL(`/?drive=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/?drive=state_mismatch", request.url),
    );
  }

  const tokens = await exchangeCodeForRefreshToken(
    code,
    new URL(request.url).origin,
  );
  if (!tokens.refresh_token) {
    return NextResponse.redirect(
      new URL("/?drive=no_refresh_token", request.url),
    );
  }

  await saveGoogleDriveRefreshToken({
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token,
    scope: tokens.scope,
  });

  const response = NextResponse.redirect(
    new URL("/?drive=connected", request.url),
  );
  response.cookies.set({
    name: GOOGLE_DRIVE_STATE_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
