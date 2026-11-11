import { idParam,ok,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { duplicateChain,getMyReport,getReportAdmin } from "@/server/services/vulnerabilities";
export const GET=route(async(_req,{params}:{params:Promise<{id:string}>})=>{
 const user=await requireApiUser(),id=idParam((await params).id);
 if(user.role==="ADMIN"){const {history}=await getReportAdmin(id);return ok({history,chain:await duplicateChain(id)});}
 const {history}=await getMyReport(user,id);return ok({history});
});
