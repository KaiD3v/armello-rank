import { verifySessionToken } from "@/lib/session-token";
import { getSessionTokenFromCookieHeader } from "@/lib/realtime-cookies";

export {
  getSessionTokenFromCookieHeader,
  parseCookieHeader,
} from "@/lib/realtime-cookies";

export async function authorizeRealtimeCookie(
  cookieHeader: string | undefined,
): Promise<boolean> {
  const token = getSessionTokenFromCookieHeader(cookieHeader);
  if (!token) {
    return false;
  }
  const session = await verifySessionToken(token);
  return session !== null;
}
