import { idParam,ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { companySchema } from "@/server/validation/schemas";
import { deleteCompany,getCompany,updateCompany } from "@/server/services/companies";
type Ctx={params:Promise<{id:string}>};
export const GET=route(async(_req,{params}:Ctx)=>{await requireApiUser("ADMIN");return ok(await getCompany(idParam((await params).id)));});
export const PATCH=route(async(req,{params}:Ctx)=>{await requireApiUser("ADMIN");await updateCompany(idParam((await params).id),await readJson(req,companySchema));return ok({updated:true});});
export const DELETE=route(async(_req,{params}:Ctx)=>{await requireApiUser("ADMIN");await deleteCompany(idParam((await params).id));return ok({deleted:true});});
