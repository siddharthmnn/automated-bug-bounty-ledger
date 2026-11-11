import { idParam,ok,readJson,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { programUpdateSchema } from "@/server/validation/schemas";
import { deleteProgram,getProgramAdmin,getPublicProgram,updateProgram } from "@/server/services/programs";
type Ctx={params:Promise<{id:string}>};
export const GET=route(async(_req,{params}:Ctx)=>{const user=await requireApiUser();const id=idParam((await params).id);return ok(user.role==="ADMIN"?await getProgramAdmin(id):await getPublicProgram(id));});
export const PATCH=route(async(req,{params}:Ctx)=>{await requireApiUser("ADMIN");await updateProgram(idParam((await params).id),await readJson(req,programUpdateSchema));return ok({updated:true});});
export const DELETE=route(async(_req,{params}:Ctx)=>{await requireApiUser("ADMIN");await deleteProgram(idParam((await params).id));return ok({deleted:true});});
