// Researcher-side report commands deliberately call DEFINER procedures.
import type { z } from "zod";
import { getPool } from "@/server/db/pools";
import { callProcedure } from "@/server/db/query";
import { AppError } from "@/server/errors";
import type { SessionUser } from "@/server/auth/session";
import type { reportSchema,reportUpdateSchema } from "@/server/validation/schemas";
export interface MyReportRow {
 vuln_id:number;title:string;severity:string;cvss_score:number|null;status:string;submitted_date:string;
 duplicate_of_vuln_id:number|null;program_id:number;program_name:string;company_name:string;
 payout_amount:number|null;payout_currency:string|null;payment_status:string|null;
}
export interface HistoryRow {old_status:string|null;new_status:string;changed_at:string;note:string|null;changed_by?:string|null;}
export async function submitReport(user:SessionUser,input:z.infer<typeof reportSchema>) {
 const [rows]=await callProcedure(getPool("researcher"),"sp_submit_vulnerability",[user.userId,input.programId,input.title,input.description,input.severity,input.cvssScore]);
 return {vulnId:Number(rows?.[0]?.vuln_id)};
}
export async function updateMyReport(user:SessionUser,vulnId:number,input:z.infer<typeof reportUpdateSchema>) {
 await callProcedure(getPool("researcher"),"sp_update_my_report",[user.userId,vulnId,input.title,input.description,input.severity,input.cvssScore]);
}
export async function withdrawMyReport(user:SessionUser,vulnId:number) {
 await callProcedure(getPool("researcher"),"sp_withdraw_my_report",[user.userId,vulnId]);
}
export async function listMyReports(user:SessionUser):Promise<MyReportRow[]> {
 const [rows]=await callProcedure(getPool("researcher"),"sp_my_reports",[user.userId]);
 return (rows??[]) as unknown as MyReportRow[];
}
export async function getMyReport(user:SessionUser,vulnId:number) {
 try {
  const sets=await callProcedure(getPool("researcher"),"sp_my_report_detail",[user.userId,vulnId]);
  if(!sets[0]?.[0])throw new AppError(404,"NOT_FOUND","Report not found");
  return {report:sets[0][0],history:(sets[1]??[]) as unknown as HistoryRow[]};
 } catch(e) {
  if((e as {errno?:number}).errno===1644)throw new AppError(404,"NOT_FOUND","Report not found");
  throw e;
 }
}
