import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { route } from "@/server/http";
import { revokeSession } from "@/server/auth/session";
import { SESSION_COOKIE } from "@/server/auth/tokens";
export const POST=route(async()=>{
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(token)await revokeSession(token);
 const res=NextResponse.json({data:{loggedOut:true}});
 res.cookies.delete(SESSION_COOKIE);return res;
});
