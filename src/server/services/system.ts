// Admin vector-sync status and retry operations.
import { getPool } from "@/server/db/pools";
import { execute,select } from "@/server/db/query";
import { env } from "@/server/env";
import { countPoints } from "@/server/vector/qdrant-paging";
export async function vectorSyncStatus() {
 const db=getPool("admin");
 const byState=await select<{state:string;jobs:number}>(db,"SELECT state,COUNT(*) jobs FROM VECTOR_SYNC_JOB GROUP BY state");
 const recent=await select<{job_id:number;vuln_id:number;operation:string;state:string;attempts:number;last_error:string|null;created_at:string;processed_at:string|null}>(db,"SELECT * FROM VECTOR_SYNC_JOB ORDER BY job_id DESC LIMIT 25");
 const [{reports}]=await select<{reports:number}>(db,"SELECT COUNT(*) reports FROM VULNERABILITY");
 let points:number|null=null,qdrantError:string|null=null;
 try{points=await countPoints();}catch(e){qdrantError=e instanceof Error?e.message:String(e);}
 return {byState,recent,reports,points,qdrantError,collection:env().QDRANT_COLLECTION,model:env().EMBEDDING_MODEL};
}
export async function retryFailedJobs():Promise<number> {
 const r=await execute(getPool("admin"),"UPDATE VECTOR_SYNC_JOB SET state='PENDING',attempts=0,last_error=NULL WHERE state='FAILED'");
 return r.affectedRows;
}
