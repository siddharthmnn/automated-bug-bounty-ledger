import { idParam,ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { payoutCompleteSchema } from "@/server/validation/schemas";
import { completePayout } from "@/server/services/ledger";
export const POST=route(async(req,{params}:{params:Promise<{id:string}>})=>{
 await requireApiUser("ADMIN");await completePayout(idParam((await params).id),await readJson(req,payoutCompleteSchema));
 return ok({processed:true});
});
