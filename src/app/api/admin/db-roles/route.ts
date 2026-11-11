import { z } from "zod";
import { ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { PRIVILEGE_PROBES,databaseGrants,runPrivilegeProbe } from "@/server/services/rbac";
export const GET=route(async()=>{await requireApiUser("ADMIN");return ok({accounts:await databaseGrants(),probes:PRIVILEGE_PROBES});});
const probeSchema=z.object({probe:z.enum(PRIVILEGE_PROBES.map(p=>p.id) as [string,...string[]])});
export const POST=route(async req=>{await requireApiUser("ADMIN");const {probe}=await readJson(req,probeSchema);return ok(await runPrivilegeProbe(probe));});
