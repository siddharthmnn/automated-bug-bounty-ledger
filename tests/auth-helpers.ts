import type { SessionUser } from "@/server/auth/session";
import { getPool } from "@/server/db/pools";
import { selectOne } from "@/server/db/query";
export async function sessionUserByEmail(email:string):Promise<SessionUser> {
 const row=await selectOne<{user_id:number;role:"ADMIN"|"RESEARCHER";researcher_id:number|null;display_name:string}>(
  getPool("auth"),"SELECT user_id,role,researcher_id,display_name FROM APP_USER WHERE email=?",[email]);
 if(!row)throw new Error(`No user ${email}; run npm run db:test-reset`);
 return {userId:row.user_id,email,role:row.role,researcherId:row.researcher_id,displayName:row.display_name};
}
