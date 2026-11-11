// Small helpers for Server Component pages.
import { notFound } from "next/navigation";
import { AppError } from "@/server/errors";
export async function orNotFound<T>(promise:Promise<T>):Promise<T> {
  try{return await promise;}catch(e){if(e instanceof AppError&&e.status===404) notFound();throw e;}
}
export function numberParam(value:string):number {
  const n=Number(value); if(!Number.isInteger(n)||n<=0) notFound(); return n;
}
