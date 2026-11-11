import { idParam,ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { reportUpdateSchema } from "@/server/validation/schemas";
import { getMyReport,getReportAdmin,updateMyReport,withdrawMyReport } from "@/server/services/vulnerabilities";
import { scheduleVectorSync } from "@/server/vector/schedule";
type Ctx={params:Promise<{id:string}>};
export const GET=route(async(_req,{params}:Ctx)=>{
 const user=await requireApiUser(),id=idParam((await params).id);
 return ok(user.role==="ADMIN"?await getReportAdmin(id):await getMyReport(user,id));
});
export const PATCH=route(async(req,{params}:Ctx)=>{
 const user=await requireApiUser("RESEARCHER");
 await updateMyReport(user,idParam((await params).id),await readJson(req,reportUpdateSchema));scheduleVectorSync();return ok({updated:true});
});
export const DELETE=route(async(_req,{params}:Ctx)=>{
 const user=await requireApiUser("RESEARCHER");await withdrawMyReport(user,idParam((await params).id));scheduleVectorSync();return ok({withdrawn:true});
});
