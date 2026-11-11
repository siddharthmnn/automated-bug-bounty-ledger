import { z } from "zod";
import { ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { retryFailedJobs,vectorSyncStatus } from "@/server/services/system";
import { processPendingJobs,reconcile } from "@/server/vector/sync";
import { ensureCollection } from "@/server/vector/qdrant";
export const GET=route(async()=>{await requireApiUser("ADMIN");return ok(await vectorSyncStatus());});
const schema=z.object({action:z.enum(["process","retry-failed","reconcile"])});
export const POST=route(async req=>{
 await requireApiUser("ADMIN");const {action}=await readJson(req,schema);await ensureCollection();
 if(action==="retry-failed"){const reset=await retryFailedJobs();return ok({reset,run:await processPendingJobs()});}
 if(action==="reconcile"){const diff=await reconcile();return ok({diff,run:await processPendingJobs()});}
 return ok({run:await processPendingJobs()});
});
