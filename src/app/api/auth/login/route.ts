import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signSession,
} from "@/lib/auth-edge";
import {
  normalizeUsername,
  updateLastLogin,
  verifyCredentials,
} from "@/lib/auth-server";

const attempts = new Map<
  string,
  {
    count: number;
    expiresAt: number;
  }
>();

function getIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function readAttempt(ip: string) {
  const record = attempts.get(ip);
  if (!record) return { count: 0, expiresAt: 0 };
  if (record.expiresAt < Date.now()) {
    attempts.delete(ip);
    return { count: 0, expiresAt: 0 };
  }
  return record;
}

export async function POST(request: Request) {
  const ip = getIp(request);
  const record = readAttempt(ip);

  if (record.count >= 5) {
    const retryAfterSeconds = Math.ceil((record.expiresAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many attempts", retryAfterSeconds },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;

  if (!body?.username || !body?.password) {
    return NextResponse.json(
      { error: "กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน" },
      { status: 400 },
    );
  }

  const user = await verifyCredentials(body.username, body.password);
  if (!user) {
    attempts.set(ip, {
      count: record.count + 1,
      expiresAt: Date.now() + 60_000,
    });
    return NextResponse.json({ error: "ชื่อผู้ใช้งานหรือรหัสผ่านผิด" }, { status: 401 });
  }

  attempts.delete(ip);
  await updateLastLogin(user.id).catch(() => null);

  const token = await signSession({
    sub: normalizeUsername(user.username),
    userId: user.id,
    name: user.name,
    role: user.role,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
