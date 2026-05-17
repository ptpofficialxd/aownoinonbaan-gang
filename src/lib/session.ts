import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  type SessionPayload,
  verifySession,
} from "@/lib/auth-edge";

export async function getServerSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  return verifySession(token).catch(() => null);
}
