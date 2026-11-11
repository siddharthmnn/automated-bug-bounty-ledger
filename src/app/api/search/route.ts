import { ok,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { AppError } from "@/server/errors";
import { listReportsAdmin } from "@/server/services/vulnerabilities";
import { semanticSearch } from "@/server/services/similarity";
export const GET=route(async req=>{
 await requireApiUser("ADMIN");const url=new URL(req.url),q=(url.searchParams.get("q")??"").trim(),mode=url.searchParams.get("mode")??"keyword";
 if(q.length<3||q.length>200)throw new AppError(400,"VALIDATION","Query must be 3 to 200 characters");
 if(mode==="semantic")return ok(await semanticSearch(q));
 if(mode==="keyword")return ok(await listReportsAdmin({q}));
 throw new AppError(400,"VALIDATION","mode must be keyword or semantic");
});
