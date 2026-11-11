// Stable facade used by pages and route handlers.
import type { z } from "zod";
import { getPool } from "@/server/db/pools";
import { callProcedure,select } from "@/server/db/query";
import type { SessionUser } from "@/server/auth/session";
import type { reviewSchema } from "@/server/validation/schemas";
export { submitReport,updateMyReport,withdrawMyReport,listMyReports,getMyReport } from "@/server/services/reports-researcher";
export { listReportsAdmin } from "@/server/services/vulnerability-admin-list";
export { getReportAdmin,duplicateChain } from "@/server/services/vulnerability-admin-detail";
export async function reviewReport(admin:SessionUser,vulnId:number,input:z.infer<typeof reviewSchema>) {
 const [rows]=await callProcedure(getPool("admin"),"sp_review_vulnerability",[
  admin.userId,vulnId,input.decision,input.decision==="DUPLICATE"?input.duplicateOf:null,input.note
 ]);
 return rows?.[0]??null;
}
export async function listProgramReportOptions(vulnId:number) {
 return select<{vuln_id:number;title:string;status:string}>(getPool("admin"),`SELECT o.vuln_id,o.title,o.status
 FROM VULNERABILITY o JOIN VULNERABILITY target ON target.program_id=o.program_id
 WHERE target.vuln_id=? AND o.vuln_id<>target.vuln_id
 AND o.status IN('TRIAGED','ACCEPTED','DUPLICATE') ORDER BY o.vuln_id`,[vulnId]);
}
