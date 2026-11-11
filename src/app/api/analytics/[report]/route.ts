import { ok,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { AppError } from "@/server/errors";
import { QUERY_CATALOGUE,runCatalogueQuery } from "@/server/services/analytics";
export const GET=route(async(_req,{params}:{params:Promise<{report:string}>})=>{
 await requireApiUser("ADMIN");const {report}=await params;
 if(report==="dashboard")throw new AppError(501,"NOT_READY","Dashboard aggregates arrive in migration 013");
 const q=QUERY_CATALOGUE.find(x=>x.id===report.toUpperCase());
 if(!q)throw new AppError(404,"NOT_FOUND","Unknown report");
 return ok({...q,rows:await runCatalogueQuery(q.id)});
});
