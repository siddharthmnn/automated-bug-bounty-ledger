import { idParam,ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { patchVerifySchema } from "@/server/validation/schemas";
import { verifyPatch } from "@/server/services/ledger";
export const POST=route(async(req,{params}:{params:Promise<{id:string}>})=>{
 const admin=await requireApiUser("ADMIN");await verifyPatch(admin,idParam((await params).id),await readJson(req,patchVerifySchema));
 return ok({verified:true});
});
