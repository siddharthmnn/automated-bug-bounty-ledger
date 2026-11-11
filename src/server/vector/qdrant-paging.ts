// Qdrant scroll/count helpers used by drift reconciliation and admin status.
import { qdrant,collectionName,type ReportPayload } from "@/server/vector/qdrant";
export async function listAllPoints(name=collectionName()):Promise<Map<number,Partial<ReportPayload>>> {
 const out=new Map<number,Partial<ReportPayload>>();let offset:string|number|null|undefined;
 do {
  const page=await qdrant().scroll(name,{limit:256,offset:offset??undefined,with_payload:true,with_vector:false});
  for(const point of page.points) {
   const payload=point.payload as Partial<ReportPayload>|null;
   out.set(Number(point.id),payload??{});
  }
  offset=page.next_page_offset as string|number|null|undefined;
 } while(offset!==null&&offset!==undefined);
 return out;
}
export async function countPoints(filter?:{status?:string},name=collectionName()):Promise<number> {
 const must=filter?.status?[{key:"status",match:{value:filter.status}}]:[];
 return (await qdrant().count(name,{filter:{must},exact:true})).count;
}
