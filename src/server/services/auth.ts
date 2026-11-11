// Registration and login use only the restricted app_auth MySQL account.
import { getPool } from "@/server/db/pools";
import { callProcedure,execute,selectOne } from "@/server/db/query";
import { AppError } from "@/server/errors";
import { hashPassword,verifyPassword } from "@/server/auth/password";
import { createSession,type Role } from "@/server/auth/session";
import type { z } from "zod";
import type { loginSchema,registerSchema } from "@/server/validation/schemas";
const DUMMY_HASH="$2b$12$HBSrKEz7gfh.QXIDLp6x5OdVv9QMJTohH/mhjbUOB2UoepotaAFFu";

export async function registerResearcher(input:z.infer<typeof registerSchema>) {
  const hash=await hashPassword(input.password);
  try {
    const [rows]=await callProcedure(getPool("auth"),"sp_register_researcher",
      [input.name,input.email,input.country,hash]);
    return {userId:Number(rows?.[0]?.user_id)};
  } catch(e) {
    if((e as {errno?:number}).errno===1062)
      throw new AppError(409,"EMAIL_TAKEN","An account with this e-mail already exists");
    throw e;
  }
}
export async function login(input:z.infer<typeof loginSchema>) {
  const pool=getPool("auth");
  const user=await selectOne<{user_id:number;password_hash:string;role:Role;is_active:number}>(
    pool,"SELECT user_id,password_hash,role,is_active FROM APP_USER WHERE email=?",[input.email]);
  const valid=await verifyPassword(input.password,user?.password_hash??DUMMY_HASH);
  if(!user||!valid||!user.is_active) throw new AppError(401,"BAD_CREDENTIALS","Incorrect e-mail or password");
  await execute(pool,"UPDATE APP_USER SET last_login_at=NOW() WHERE user_id=?",[user.user_id]);
  const session=await createSession(user.user_id);
  return {...session,role:user.role};
}
export async function platformStats() {
  return selectOne<Record<string,number>>(getPool("auth"),"SELECT * FROM v_platform_stats");
}
