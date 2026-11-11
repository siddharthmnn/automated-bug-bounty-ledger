import { ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { patchCreateSchema } from "@/server/validation/schemas";
import { listPatchQueue,recordPatch } from "@/server/services/ledger";
export const GET=route(async()=>{await requireApiUser("ADMIN");return ok(await listPatchQueue());});
export const POST=route(async req=>{await requireApiUser("ADMIN");return ok(await recordPatch(await readJson(req,patchCreateSchema)),201);});
