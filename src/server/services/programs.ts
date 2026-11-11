// Admins manage programs; researchers read only the v_program_public view.
import type { z } from "zod";
import { getPool } from "@/server/db/pools";
import { execute,select,selectOne } from "@/server/db/query";
import { AppError } from "@/server/errors";
import type { programSchema,programUpdateSchema } from "@/server/validation/schemas";
export interface ProgramStatsRow {
 program_id:number;program_name:string;status:string;company_id:number;company_name:string;
 total_reports:number;submitted:number;triaged:number;accepted:number;rejected:number;duplicates:number;critical_reports:number;
 currency:string|null;total_paid:number;
}
export async function listProgramsAdmin(companyId?:number):Promise<ProgramStatsRow[]> {
 return select<ProgramStatsRow>(getPool("admin"),
  `SELECT * FROM v_program_stats ${companyId?"WHERE company_id = ?":""} ORDER BY company_name,program_name,currency`,
  companyId?[companyId]:[]);
}
export async function getProgramAdmin(id:number) {
 const p=await selectOne<{program_id:number;name:string;scope:string|null;status:"ACTIVE"|"PAUSED"|"CLOSED";company_id:number;company_name:string}>(
  getPool("admin"),`SELECT p.program_id,p.name,p.scope,p.status,p.company_id,c.name company_name
   FROM PROGRAM p JOIN COMPANY c ON c.company_id=p.company_id WHERE p.program_id=?`,[id]);
 if(!p)throw new AppError(404,"NOT_FOUND","Program not found");
 const stats=await select<ProgramStatsRow>(getPool("admin"),"SELECT * FROM v_program_stats WHERE program_id=? ORDER BY currency",[id]);
 return {program:p,stats};
}
export async function createProgram(input:z.infer<typeof programSchema>) {
 const r=await execute(getPool("admin"),"INSERT INTO PROGRAM(name,scope,status,company_id) VALUES(?,?,?,?)",[input.name,input.scope,input.status,input.companyId]);
 return {programId:r.insertId};
}
export async function updateProgram(id:number,input:z.infer<typeof programUpdateSchema>) {
 const r=await execute(getPool("admin"),"UPDATE PROGRAM SET name=?,scope=?,status=? WHERE program_id=?",[input.name,input.scope,input.status,id]);
 if(r.affectedRows===0)throw new AppError(404,"NOT_FOUND","Program not found");
}
export async function deleteProgram(id:number) {
 const r=await execute(getPool("admin"),"DELETE FROM PROGRAM WHERE program_id=?",[id]);
 if(r.affectedRows===0)throw new AppError(404,"NOT_FOUND","Program not found");
}
export interface PublicProgramRow {
 program_id:number;program_name:string;scope:string|null;status:string;company_id:number;
 company_name:string;industry:string|null;website:string|null;accepted_reports:number;
}
export async function listPublicPrograms():Promise<PublicProgramRow[]> {
 return select<PublicProgramRow>(getPool("researcher"),"SELECT * FROM v_program_public ORDER BY company_name,program_name");
}
export async function getPublicProgram(id:number):Promise<PublicProgramRow> {
 const row=await selectOne<PublicProgramRow>(getPool("researcher"),"SELECT * FROM v_program_public WHERE program_id=?",[id]);
 if(!row)throw new AppError(404,"NOT_FOUND","Program not found or not active");return row;
}
