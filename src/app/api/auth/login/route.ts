import { NextResponse } from "next/server";
import { readJson,route } from "@/server/http";
import { loginSchema } from "@/server/validation/schemas";
import { login } from "@/server/services/auth";
import { sessionCookieOptions } from "@/server/auth/session";
import { SESSION_COOKIE } from "@/server/auth/tokens";
import { homeFor } from "@/server/auth/guard";
export const POST=route(async req=>{
 const input=await readJson(req,loginSchema);
 const {token,expiresAt,role}=await login(input);
 const res=NextResponse.json({data:{role,redirectTo:homeFor(role)}});
 res.cookies.set(SESSION_COOKIE,token,sessionCookieOptions(expiresAt));
 return res;
});
