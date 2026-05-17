import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-edge";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
