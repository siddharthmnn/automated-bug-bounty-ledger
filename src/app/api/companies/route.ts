import { ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { companySchema } from "@/server/validation/schemas";
import { createCompany,listCompanies } from "@/server/services/companies";
export const GET=route(async()=>{await requireApiUser("ADMIN");return ok(await listCompanies());});
export const POST=route(async req=>{await requireApiUser("ADMIN");return ok(await createCompany(await readJson(req,companySchema)),201);});
