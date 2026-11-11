import { ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { programSchema } from "@/server/validation/schemas";
import { createProgram,listProgramsAdmin,listPublicPrograms } from "@/server/services/programs";
export const GET=route(async()=>{const user=await requireApiUser();return ok(user.role==="ADMIN"?await listProgramsAdmin():await listPublicPrograms());});
export const POST=route(async req=>{await requireApiUser("ADMIN");return ok(await createProgram(await readJson(req,programSchema)),201);});
