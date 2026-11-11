import { ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { reportFilterSchema,reportSchema } from "@/server/validation/schemas";
import { listReportsAdmin,submitReport } from "@/server/services/vulnerabilities";
import { AppError } from "@/server/errors";
export const GET=route(async req=>{
 await requireApiUser("ADMIN");const params=Object.fromEntries(new URL(req.url).searchParams);
 const parsed=reportFilterSchema.safeParse(params);if(!parsed.success)throw new AppError(400,"VALIDATION","Invalid filter");
 return ok(await listReportsAdmin(parsed.data));
});
export const POST=route(async req=>{
 const user=await requireApiUser("RESEARCHER");
 return ok(await submitReport(user,await readJson(req,reportSchema)),201);
});
