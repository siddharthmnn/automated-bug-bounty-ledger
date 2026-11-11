// Company management (ADMIN only, app_admin database account).
import type { z } from "zod";
import { getPool } from "@/server/db/pools";
import { execute,select,selectOne } from "@/server/db/query";
import { AppError } from "@/server/errors";
import type { companySchema } from "@/server/validation/schemas";
type CompanyInput=z.infer<typeof companySchema>;
export interface CompanyRow {
 company_id:number;name:string;industry:string|null;website:string|null;
 programs:number;active_programs:number;total_paid:number;
}
export async function listCompanies():Promise<CompanyRow[]> {
 return select<CompanyRow>(getPool("admin"),`
 SELECT c.company_id,c.name,c.industry,c.website,
        COUNT(DISTINCT p.program_id) programs,
        COUNT(DISTINCT CASE WHEN p.status='ACTIVE' THEN p.program_id END) active_programs,
        COALESCE(pay.total_paid,0) total_paid
 FROM COMPANY c
 LEFT JOIN PROGRAM p ON p.company_id=c.company_id
 LEFT JOIN (
   SELECT v.program_id,SUM(py.amount) total_paid
   FROM PAYOUT py JOIN VULNERABILITY v ON v.vuln_id=py.vuln_id
   WHERE py.payment_status='COMPLETED' GROUP BY v.program_id
 ) pay ON pay.program_id=p.program_id
 GROUP BY c.company_id,c.name,c.industry,c.website ORDER BY c.name`);
}
export async function getCompany(id:number) {
 const row=await selectOne<{company_id:number;name:string;industry:string|null;website:string|null}>(
  getPool("admin"),"SELECT company_id,name,industry,website FROM COMPANY WHERE company_id=?",[id]);
 if(!row)throw new AppError(404,"NOT_FOUND","Company not found");return row;
}
export async function createCompany(input:CompanyInput) {
 const r=await execute(getPool("admin"),"INSERT INTO COMPANY(name,industry,website) VALUES(?,?,?)",[input.name,input.industry,input.website]);
 return {companyId:r.insertId};
}
export async function updateCompany(id:number,input:CompanyInput) {
 const r=await execute(getPool("admin"),"UPDATE COMPANY SET name=?,industry=?,website=? WHERE company_id=?",[input.name,input.industry,input.website,id]);
 if(r.affectedRows===0)throw new AppError(404,"NOT_FOUND","Company not found");
}
export async function deleteCompany(id:number) {
 const r=await execute(getPool("admin"),"DELETE FROM COMPANY WHERE company_id=?",[id]);
 if(r.affectedRows===0)throw new AppError(404,"NOT_FOUND","Company not found");
}
