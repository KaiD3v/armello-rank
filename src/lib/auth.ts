import "server-only";

import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/session-token";

export {
  SESSION_COOKIE,
  createSessionToken,
  hashAccessCode,
  sessionCookieOptions,
  verifyAccessCode,
  verifySessionToken,
} from "@/lib/session-token";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}
