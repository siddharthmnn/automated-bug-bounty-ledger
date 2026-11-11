// Shared Node 22+ bootstrap for local maintenance scripts.
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
export async function main(fn:()=>Promise<void>) {
 const {closePools}=await import("@/server/db/pools");
 try{await fn();}catch(e){console.error(e instanceof Error?e.message:e);process.exitCode=1;}
 finally{await closePools();}
}
