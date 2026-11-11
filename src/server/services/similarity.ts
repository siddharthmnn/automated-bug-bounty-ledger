// Qdrant suggestions are advisory; report review remains an explicit admin decision.
import { getPool } from "@/server/db/pools";
import { select,selectOne } from "@/server/db/query";
import { env } from "@/server/env";
import { AppError } from "@/server/errors";
import type { EmbedFn } from "@/server/vector/embedder";
import { getReportPoint,searchSimilar } from "@/server/vector/qdrant";
import { buildEmbeddingText } from "@/server/vector/text";
export interface SimilarReport {
 vuln_id:number;score:number;likely_duplicate:boolean;title:string;status:string;severity:string;
 program_name:string;researcher_name:string;submitted_date:string;
}
async function defaultEmbed(texts:string[]) {
 const {embedTexts}=await import("@/server/vector/embedder");return embedTexts(texts);
}
async function hydrate(hits:{vulnId:number;score:number}[]):Promise<SimilarReport[]> {
 if(!hits.length)return [];
 const ids=hits.map(h=>h.vulnId);
 const rows=await select<Omit<SimilarReport,"score"|"likely_duplicate">>(getPool("admin"),`SELECT v.vuln_id,v.title,v.status,v.severity,
 p.name program_name,r.name researcher_name,v.submitted_date
 FROM VULNERABILITY v JOIN PROGRAM p ON p.program_id=v.program_id
 JOIN RESEARCHER r ON r.researcher_id=v.researcher_id WHERE v.vuln_id IN (?)`,[ids]);
 const byId=new Map(rows.map(r=>[r.vuln_id,r])),threshold=env().SIMILARITY_THRESHOLD;
 return hits.filter(h=>byId.has(h.vulnId)).map(h=>({...byId.get(h.vulnId)!,score:Number(h.score.toFixed(4)),likely_duplicate:h.score>=threshold}));
}
async function vectorStep<T>(fn:()=>Promise<T>):Promise<T> {
 try{return await fn();}catch(e){
  if(e instanceof AppError)throw e;
  console.error("[similarity]",e instanceof Error?e.message:String(e));
  throw new AppError(503,"VECTOR_UNAVAILABLE","Semantic search is not ready: start Qdrant and run npm run vector:backfill.");
 }
}
export async function similarToReport(vulnId:number,limit=5,embed:EmbedFn=defaultEmbed) {
 const report=await selectOne<{title:string;description:string|null;company_id:number}>(getPool("admin"),
  "SELECT v.title,v.description,p.company_id FROM VULNERABILITY v JOIN PROGRAM p ON p.program_id=v.program_id WHERE v.vuln_id=?",[vulnId]);
 if(!report)throw new AppError(404,"NOT_FOUND","Report not found");
 const pointAndHits=await vectorStep(async()=>{
  const point=await getReportPoint(vulnId,true);const stored=point?.vector;
  const vector=Array.isArray(stored)?stored as number[]:(await embed([buildEmbeddingText(report.title,report.description)]))[0];
  if(!vector)throw new Error("Embedding model returned no vector");
  return {point,hits:await searchSimilar(vector,{companyId:report.company_id,excludeVulnId:vulnId,limit})};
 });
 return {indexed:Boolean(pointAndHits.point),threshold:env().SIMILARITY_THRESHOLD,results:await hydrate(pointAndHits.hits)};
}
export async function semanticSearch(query:string,limit=10,embed:EmbedFn=defaultEmbed) {
 const hits=await vectorStep(async()=>{const [vector]=await embed([query.trim()]);if(!vector)throw new Error("Embedding model returned no vector");return searchSimilar(vector,{limit});});
 return hydrate(hits);
}
