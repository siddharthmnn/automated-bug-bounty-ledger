import { idParam,ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { reviewSchema } from "@/server/validation/schemas";
import { reviewReport } from "@/server/services/vulnerabilities";
export const POST=route(async(req,{params}:{params:Promise<{id:string}>})=>{
 const admin=await requireApiUser("ADMIN");
 return ok(await reviewReport(admin,idParam((await params).id),await readJson(req,reviewSchema)));
});
