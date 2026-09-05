import { SignJWT, jwtVerify } from "jose";

import {
  accessCodesEqual,
  hashAccessCode,
  isSessionCodeCurrent,
} from "@/lib/access-code";

export { hashAccessCode } from "@/lib/access-code";

export const SESSION_COOKIE = "armello_session";

export type SessionPayload = {
  codeHash: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(requireEnv("ACCESS_SECRET"));
}

export function verifyAccessCode(code: string): boolean {
  return accessCodesEqual(code, requireEnv("ACCESS_CODE"));
}

export async function createSessionToken(): Promise<string> {
  const codeHash = hashAccessCode(requireEnv("ACCESS_CODE"));
  return new SignJWT({ codeHash } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const codeHash = payload.codeHash;
    if (typeof codeHash !== "string") {
      return null;
    }
    if (!isSessionCodeCurrent(codeHash, requireEnv("ACCESS_CODE"))) {
      return null;
    }
    return { codeHash };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds?: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(typeof maxAgeSeconds === "number" ? { maxAge: maxAgeSeconds } : {}),
  };
}
