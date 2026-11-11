import { ok,readJson,route } from "@/server/http";
import { registerSchema } from "@/server/validation/schemas";
import { registerResearcher } from "@/server/services/auth";
export const POST=route(async req=>{
 const input=await readJson(req,registerSchema);
 return ok(await registerResearcher(input),201);
});
