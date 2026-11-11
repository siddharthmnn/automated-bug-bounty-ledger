import { ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { payoutCreateSchema } from "@/server/validation/schemas";
import { createPayout,listPayoutQueue } from "@/server/services/ledger";
export const GET=route(async()=>{await requireApiUser("ADMIN");return ok(await listPayoutQueue());});
export const POST=route(async req=>{await requireApiUser("ADMIN");return ok(await createPayout(await readJson(req,payoutCreateSchema)),201);});
