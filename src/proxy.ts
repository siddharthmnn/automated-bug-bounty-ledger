// Optimistic cookie check only. Every page and API performs authoritative DB validation.
import { NextResponse,type NextRequest } from "next/server";
const SESSION_COOKIE="abbl_session";
export function proxy(request:NextRequest) {
 if(!request.cookies.has(SESSION_COOKIE)) {
  const url=new URL("/login",request.url);url.searchParams.set("next",request.nextUrl.pathname);
  return NextResponse.redirect(url);
 }
 return NextResponse.next();
}
export const config={matcher:["/admin/:path*","/researcher/:path*","/leaderboard"]};
