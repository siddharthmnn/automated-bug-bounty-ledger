import { idParam,ok,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { similarToReport } from "@/server/services/similarity";
export const GET=route(async(req,{params}:{params:Promise<{id:string}>})=>{
 await requireApiUser("ADMIN");const limit=Math.min(Math.max(Number(new URL(req.url).searchParams.get("limit")??5)||5,1),20);
 return ok(await similarToReport(idParam((await params).id),limit));
});
