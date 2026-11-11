// Shared JSON response, error, and request-validation helpers for API routes.
import { NextResponse } from "next/server";
import type { z } from "zod";
import { AppError,toAppError } from "@/server/errors";
export function ok<T>(data:T,status=200) { return NextResponse.json({data},{status}); }
export function errorResponse(e:unknown) {
  const err=toAppError(e); if(err.status>=500) console.error(e);
  return NextResponse.json({error:{code:err.code,message:err.message}},{status:err.status});
}
export function route<C>(handler:(req:Request,ctx:C)=>Promise<Response>) {
  return async(req:Request,ctx:C):Promise<Response>=>{
    try{return await handler(req,ctx);}catch(e){return errorResponse(e);}
  };
}
export async function readJson<S extends z.ZodType>(req:Request,schema:S):Promise<z.infer<S>> {
  let body:unknown;
  try{body=await req.json();}catch{throw new AppError(400,"BAD_JSON","Request body must be JSON");}
  const parsed=schema.safeParse(body);
  if(!parsed.success) {
    const first=parsed.error.issues[0],where=first?.path.length?first.path.join(".")+": ":"";
    throw new AppError(400,"VALIDATION",where+(first?.message??"Invalid input"));
  }
  return parsed.data;
}
export function idParam(value:string):number {
  const id=Number(value); if(!Number.isInteger(id)||id<=0) throw new AppError(400,"BAD_ID","Invalid id");
  return id;
}
