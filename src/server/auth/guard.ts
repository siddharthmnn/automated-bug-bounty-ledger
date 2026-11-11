// Server-side authorization. API handlers return 401/403; pages redirect.
import { redirect } from "next/navigation";
import { AppError } from "@/server/errors";
import { getCurrentUser, type Role, type SessionUser } from "@/server/auth/session";
export async function requireApiUser(role?:Role):Promise<SessionUser> {
  const user=await getCurrentUser();
  if(!user) throw new AppError(401,"UNAUTHENTICATED","Please log in");
  if(role && user.role!==role) throw new AppError(403,"FORBIDDEN","Your role cannot do this");
  return user;
}
export function homeFor(role:Role):string { return role==="ADMIN"?"/admin":"/researcher"; }
export async function requirePageUser(role?:Role):Promise<SessionUser> {
  const user=await getCurrentUser();
  if(!user) redirect("/login");
  if(role && user.role!==role) redirect(homeFor(user.role));
  return user;
}
