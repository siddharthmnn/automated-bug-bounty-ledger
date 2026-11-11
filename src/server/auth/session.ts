// Server-side sessions stored in USER_SESSION; only token hashes persist.
import { cache } from "react";
import { cookies } from "next/headers";
import { getPool } from "@/server/db/pools";
import { execute, selectOne } from "@/server/db/query";
import { env } from "@/server/env";
import { SESSION_COOKIE, hashToken, newSessionToken } from "@/server/auth/tokens";

export type Role = "ADMIN" | "RESEARCHER";
export interface SessionUser {
  userId:number; email:string; role:Role; researcherId:number|null; displayName:string;
}
export async function createSession(userId:number):Promise<{token:string;expiresAt:Date}> {
  const token=newSessionToken(), hours=env().SESSION_TTL_HOURS;
  await execute(getPool("auth"),
    "INSERT INTO USER_SESSION (user_id,token_hash,expires_at) VALUES (?, ?, NOW() + INTERVAL ? HOUR)",
    [userId,hashToken(token),hours]);
  return {token,expiresAt:new Date(Date.now()+hours*3600*1000)};
}
export async function findSessionUser(token:string):Promise<SessionUser|null> {
  const row=await selectOne<{user_id:number;email:string;role:Role;researcher_id:number|null;display_name:string}>(
    getPool("auth"),
    `SELECT u.user_id,u.email,u.role,u.researcher_id,u.display_name
       FROM USER_SESSION s JOIN APP_USER u ON u.user_id=s.user_id
      WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>NOW() AND u.is_active`,
    [hashToken(token)]);
  return row ? {userId:row.user_id,email:row.email,role:row.role,researcherId:row.researcher_id,displayName:row.display_name}:null;
}
export async function revokeSession(token:string):Promise<void> {
  await execute(getPool("auth"),
    "UPDATE USER_SESSION SET revoked_at=NOW() WHERE token_hash=? AND revoked_at IS NULL",[hashToken(token)]);
}
export const getCurrentUser=cache(async():Promise<SessionUser|null>=>{
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  return token ? findSessionUser(token) : null;
});
export function sessionCookieOptions(expiresAt:Date) {
  return {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/",expires:expiresAt};
}
