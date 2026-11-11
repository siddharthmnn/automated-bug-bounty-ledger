// Durable outbox processor and MySQL/Qdrant drift repair.
import type { Pool } from "mysql2/promise";
import { getPool } from "@/server/db/pools";
import { execute,select } from "@/server/db/query";
import { env } from "@/server/env";
import { collectionName } from "@/server/vector/qdrant";
import { listAllPoints } from "@/server/vector/qdrant-paging";
import { buildEmbeddingText,textHash } from "@/server/vector/text";
import { syncReport,type SyncDeps,type SyncOutcome } from "@/server/vector/sync-core";
export const MAX_ATTEMPTS=5;
export interface SyncRunResult {processed:number;failed:number;outcomes:Record<SyncOutcome,number>;}
let running:Promise<SyncRunResult>|null=null;
export function processPendingJobs(deps?:Partial<SyncDeps>,limit=100):Promise<SyncRunResult> {
 if(running)return running;
 const task=runOnce(deps,Math.min(Math.max(Math.floor(limit),1),500));
 const tracked=task.finally(()=>{if(running===tracked)running=null;});
 running=tracked;
 return tracked;
}
async function runOnce(deps:Partial<SyncDeps>|undefined,limit:number):Promise<SyncRunResult> {
 const db=deps?.db??getPool("vector");
 const result:SyncRunResult={processed:0,failed:0,outcomes:{upserted:0,"payload-updated":0,deleted:0}};
 const groups=await select<{vuln_id:number;last_job:number}>(db,`SELECT vuln_id,MAX(job_id) last_job FROM VECTOR_SYNC_JOB
 WHERE state='PENDING' GROUP BY vuln_id ORDER BY MIN(job_id) LIMIT ?`,[limit]);
 for(const group of groups){
  try{
   const outcome=await syncReport(group.vuln_id,deps);
   await execute(db,`UPDATE VECTOR_SYNC_JOB SET state='DONE',attempts=attempts+1,processed_at=NOW(),last_error=NULL
    WHERE vuln_id=? AND state='PENDING' AND job_id<=?`,[group.vuln_id,group.last_job]);
   result.processed++;result.outcomes[outcome]++;
  }catch(e){
   const message=(e instanceof Error?e.message:String(e)).slice(0,500);
   await execute(db,`UPDATE VECTOR_SYNC_JOB SET last_error=?,state=IF(attempts+1>=?,'FAILED','PENDING'),attempts=attempts+1
    WHERE vuln_id=? AND state='PENDING' AND job_id<=?`,[message,MAX_ATTEMPTS,group.vuln_id,group.last_job]);
   result.failed++;
   if(/ECONNREFUSED|fetch failed|ENOTFOUND|ECONNRESET/i.test(message))break;
  }
 }
 return result;
}
export async function enqueueAllReports(db:Pool=getPool("vector")):Promise<number> {
 const r=await execute(db,"INSERT INTO VECTOR_SYNC_JOB(vuln_id,operation) SELECT vuln_id,'UPSERT' FROM VULNERABILITY");
 return r.affectedRows;
}
export async function reconcile(deps?:Partial<SyncDeps>) {
 const db=deps?.db??getPool("vector"),collection=deps?.collection??collectionName();
 const rows=await select<{vuln_id:number;title:string;description:string|null}>(db,"SELECT vuln_id,title,description FROM VULNERABILITY");
 const points=await listAllPoints(collection),expectedModel=env().EMBEDDING_MODEL;
 const mysqlIds=new Set<number>(),upserts:number[]=[];
 for(const row of rows){
  mysqlIds.add(row.vuln_id);
  const expected=`${textHash(buildEmbeddingText(row.title,row.description))}:${expectedModel}`;
  if(points.get(row.vuln_id)!==expected)upserts.push(row.vuln_id);
 }
 const deletes=[...points.keys()].filter(id=>!mysqlIds.has(id));
 for(const id of upserts)await execute(db,"INSERT INTO VECTOR_SYNC_JOB(vuln_id,operation) VALUES(?,'UPSERT')",[id]);
 for(const id of deletes)await execute(db,"INSERT INTO VECTOR_SYNC_JOB(vuln_id,operation) VALUES(?,'DELETE')",[id]);
 return {mysqlReports:rows.length,qdrantPoints:points.size,queuedUpserts:upserts.length,queuedDeletes:deletes.length};
}
