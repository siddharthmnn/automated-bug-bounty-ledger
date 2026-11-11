import { idParam,ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { reviewSchema } from "@/server/validation/schemas";
import { reviewReport } from "@/server/services/vulnerabilities";
import { scheduleVectorSync } from "@/server/vector/schedule";
export const POST=route(async(req,{params}:{params:Promise<{id:string}>})=>{
 const admin=await requireApiUser("ADMIN");
 const result=await reviewReport(admin,idParam((await params).id),await readJson(req,reviewSchema));scheduleVectorSync();return ok(result);
});
