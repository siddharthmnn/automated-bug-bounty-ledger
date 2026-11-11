// Drain a small outbox batch after the HTTP response; report writes do not wait for embeddings.
import { after } from "next/server";
import { processPendingJobs } from "@/server/vector/sync";
export function scheduleVectorSync():void {
 after(async()=>{
  try{await processPendingJobs(undefined,25);}
  catch(e){console.error("Vector sync failed; jobs remain queued",e);}
 });
}
