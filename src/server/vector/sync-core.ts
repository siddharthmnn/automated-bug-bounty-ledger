// Idempotent one-report MySQL -> Qdrant synchronization.
import type { Pool } from "mysql2/promise";
import { getPool } from "@/server/db/pools";
import { selectOne } from "@/server/db/query";
import { env } from "@/server/env";
import type { EmbedFn } from "@/server/vector/embedder";
import { collectionName,deleteReport,getReportPoint,setReportPayload,upsertReport,type ReportPayload } from "@/server/vector/qdrant";
import { buildEmbeddingText,textHash } from "@/server/vector/text";
export interface SyncDeps {embed:EmbedFn;collection?:string;db?:Pool;}
export type SyncOutcome="upserted"|"payload-updated"|"deleted";
async function defaultEmbed(texts:string[]) {
 const {embedTexts}=await import("@/server/vector/embedder");return embedTexts(texts);
}
function resolve(deps?:Partial<SyncDeps>) {
 return {embed:deps?.embed??defaultEmbed,collection:deps?.collection??collectionName(),db:deps?.db??getPool("vector")};
}
interface ReportRow {
 vuln_id:number;title:string;description:string|null;severity:string;status:string;submitted_date:string;
 program_id:number;researcher_id:number;company_id:number;
}
export async function syncReport(vulnId:number,deps?:Partial<SyncDeps>):Promise<SyncOutcome> {
 const {embed,collection,db}=resolve(deps);
 const row=await selectOne<ReportRow>(db,`SELECT v.vuln_id,v.title,v.description,v.severity,v.status,v.submitted_date,
 v.program_id,v.researcher_id,p.company_id FROM VULNERABILITY v
 JOIN PROGRAM p ON p.program_id=v.program_id WHERE v.vuln_id=?`,[vulnId]);
 if(!row){await deleteReport(vulnId,collection);return "deleted";}
 const text=buildEmbeddingText(row.title,row.description);
 const payload:ReportPayload={vuln_id:row.vuln_id,company_id:row.company_id,program_id:row.program_id,
 researcher_id:row.researcher_id,severity:row.severity,status:row.status,submitted_date:row.submitted_date,
 text_sha256:textHash(text),model_name:env().EMBEDDING_MODEL};
 const existing=await getReportPoint(vulnId,false,collection);
 const old=existing?.payload as Partial<ReportPayload>|undefined;
 if(old?.text_sha256===payload.text_sha256&&old.model_name===payload.model_name){
  await setReportPayload(vulnId,payload,collection);return "payload-updated";
 }
 const [vector]=await embed([text]);
 if(!vector)throw new Error("Embedder returned no vector for the report");
 await upsertReport(vector,payload,collection);return "upserted";
}
