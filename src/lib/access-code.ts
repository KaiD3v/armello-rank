import { createHmac, timingSafeEqual } from "crypto";

/** Stable hash of the shared access code; used inside the session JWT. */
export function hashAccessCode(code: string): string {
  return createHmac("sha256", "armello-code-hash")
    .update(code)
    .digest("hex");
}

export function accessCodesEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

/** Returns true when the token's codeHash matches the current ACCESS_CODE. */
export function isSessionCodeCurrent(
  codeHash: string,
  currentAccessCode: string,
): boolean {
  const expected = hashAccessCode(currentAccessCode);
  return accessCodesEqual(codeHash, expected);
}
