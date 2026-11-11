// The browser holds a random token; MySQL stores only its SHA-256 digest.
import { createHash, randomBytes } from "node:crypto";
export const SESSION_COOKIE = "abbl_session";
export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
