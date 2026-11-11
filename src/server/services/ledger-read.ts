// Read models for the patch queue, payout queue and researcher ledger.
import { getPool } from "@/server/db/pools";
import { callProcedure,select } from "@/server/db/query";
import type { SessionUser } from "@/server/auth/session";
export interface PatchRow {
 patch_id:number|null;vuln_id:number;title:string;severity:string;company_name:string;program_name:string;
 patch_date:string|null;verification_status:string|null;verified_by:string|null;verified_at:string|null;notes:string|null;
}
export async function listPatchQueue():Promise<PatchRow[]> {
 return select<PatchRow>(getPool("admin"),`SELECT pt.patch_id,v.vuln_id,v.title,v.severity,c.name company_name,p.name program_name,
 pt.patch_date,pt.verification_status,pt.verified_by,pt.verified_at,pt.notes
 FROM VULNERABILITY v JOIN PROGRAM p ON p.program_id=v.program_id
 JOIN COMPANY c ON c.company_id=p.company_id LEFT JOIN PATCH pt ON pt.vuln_id=v.vuln_id
 WHERE v.status='ACCEPTED'
 ORDER BY (pt.patch_id IS NULL) DESC,FIELD(pt.verification_status,'PENDING','FAILED','VERIFIED'),
 FIELD(v.severity,'CRITICAL','HIGH','MEDIUM','LOW'),v.vuln_id`);
}
export interface PayoutRow {
 payout_id:number|null;vuln_id:number;title:string;severity:string;cvss_score:number|null;
 researcher_name:string;company_name:string;amount:number|null;currency:string|null;
 payment_status:string|null;payment_date:string|null;verification_status:string|null;suggested_severity:string|null;
}
export async function listPayoutQueue():Promise<PayoutRow[]> {
 return select<PayoutRow>(getPool("admin"),`SELECT py.payout_id,v.vuln_id,v.title,v.severity,v.cvss_score,
 r.name researcher_name,c.name company_name,py.amount,py.currency,py.payment_status,py.payment_date,
 pt.verification_status,fn_severity_from_cvss(v.cvss_score) suggested_severity
 FROM VULNERABILITY v JOIN RESEARCHER r ON r.researcher_id=v.researcher_id
 JOIN PROGRAM p ON p.program_id=v.program_id JOIN COMPANY c ON c.company_id=p.company_id
 LEFT JOIN PATCH pt ON pt.patch_id=(SELECT MAX(x.patch_id) FROM PATCH x WHERE x.vuln_id=v.vuln_id)
 LEFT JOIN PAYOUT py ON py.vuln_id=v.vuln_id
 WHERE v.status='ACCEPTED'
 ORDER BY (py.payout_id IS NULL) DESC,FIELD(py.payment_status,'PENDING','FAILED','COMPLETED'),
 COALESCE(py.payment_date,'9999-12-31') DESC,v.vuln_id`);
}
export interface MyPayoutRow {
 payout_id:number;amount:number;currency:string;payment_status:string;payment_date:string|null;
 vuln_id:number;title:string;severity:string;program_name:string;company_name:string;
}
export async function listMyPayouts(user:SessionUser):Promise<MyPayoutRow[]> {
 const [rows]=await callProcedure(getPool("researcher"),"sp_my_payouts",[user.userId]);
 return (rows??[]) as unknown as MyPayoutRow[];
}
export async function researcherEarningsByCurrency(researcherId:number) {
 return select<{currency:string;earned:number}>(getPool("admin"),`SELECT py.currency,SUM(py.amount) earned
 FROM PAYOUT py JOIN VULNERABILITY v ON v.vuln_id=py.vuln_id
 WHERE v.researcher_id=? AND py.payment_status='COMPLETED'
 GROUP BY py.currency ORDER BY py.currency`,[researcherId]);
}
