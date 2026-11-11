// Official Qdrant REST client wrapper. Report text stays in MySQL.
import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "@/server/env";
export interface ReportPayload {
 vuln_id:number;company_id:number;program_id:number;researcher_id:number;
 severity:string;status:string;submitted_date:string;text_sha256:string;model_name:string;
}
let client:QdrantClient|null=null;
export function qdrant():QdrantClient {
 if(!client)client=new QdrantClient({url:env().QDRANT_URL,checkCompatibility:false});
 return client;
}
export const collectionName=()=>env().QDRANT_COLLECTION;
export async function ensureCollection(name=collectionName()):Promise<"created"|"exists"> {
 const c=qdrant();const {exists}=await c.collectionExists(name);if(exists)return "exists";
 await c.createCollection(name,{vectors:{size:env().EMBEDDING_DIM,distance:"Cosine"},hnsw_config:{m:16,ef_construct:100}});
 for(const [field,field_schema] of [["company_id","integer"],["program_id","integer"],["status","keyword"],["severity","keyword"]] as const)
  await c.createPayloadIndex(name,{field_name:field,field_schema,wait:true});
 return "created";
}
export async function upsertReport(vector:number[],payload:ReportPayload,name=collectionName()) {
 if(vector.length!==env().EMBEDDING_DIM)throw new Error("Refusing to store a vector with the wrong dimension");
 await qdrant().upsert(name,{wait:true,points:[{id:payload.vuln_id,vector,payload:{...payload}}]});
}
export async function setReportPayload(vulnId:number,payload:Partial<ReportPayload>,name=collectionName()) {
 await qdrant().setPayload(name,{points:[vulnId],payload:{...payload},wait:true});
}
export async function deleteReport(vulnId:number,name=collectionName()) {
 await qdrant().delete(name,{points:[vulnId],wait:true});
}
export async function getReportPoint(vulnId:number,withVector=false,name=collectionName()) {
 const points=await qdrant().retrieve(name,{ids:[vulnId],with_payload:true,with_vector:withVector});
 return points[0]??null;
}
export interface SimilarHit {vulnId:number;score:number;payload:ReportPayload;}
export async function searchSimilar(vector:number[],opts:{companyId?:number;excludeVulnId?:number;limit?:number},name=collectionName()):Promise<SimilarHit[]> {
 const must=opts.companyId?[{key:"company_id",match:{value:opts.companyId}}]:[];
 const mustNot=opts.excludeVulnId?[{has_id:[opts.excludeVulnId]}]:[];
 const res=await qdrant().query(name,{query:vector,filter:{must,must_not:mustNot},limit:opts.limit??5,with_payload:true});
 return res.points.map(p=>({vulnId:Number(p.id),score:p.score,payload:p.payload as unknown as ReportPayload}));
}
