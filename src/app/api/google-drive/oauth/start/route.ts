import { NextResponse } from "next/server";
import {
  buildGoogleDriveAuthUrl,
  createGoogleDriveOAuthState,
  GOOGLE_DRIVE_STATE_COOKIE,
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
    return NextResponse.redirect(
      new URL("/?drive=forbidden", request.url),
    );
  }

  const state = createGoogleDriveOAuthState();
  const authUrl = buildGoogleDriveAuthUrl(state, new URL(request.url).origin);
  const response = NextResponse.redirect(authUrl);
  response.cookies.set({
    name: GOOGLE_DRIVE_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
