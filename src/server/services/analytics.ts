import { getPool } from "@/server/db/pools";
import { select,type Row } from "@/server/db/query";
import { QUERY_A } from "@/server/services/analytics-catalogue-a";
import { QUERY_B } from "@/server/services/analytics-catalogue-b";
export type { CatalogueQuery } from "@/server/services/analytics-catalogue-a";
export const QUERY_CATALOGUE=[...QUERY_A,...QUERY_B];
export async function runCatalogueQuery(id:string):Promise<Row[]> {
 const q=QUERY_CATALOGUE.find(x=>x.id===id);return q?select<Row>(getPool("admin"),q.sql):[];
}
export async function runAllCatalogueQueries() {
 const out=[];for(const q of QUERY_CATALOGUE)out.push({...q,rows:await select<Row>(getPool("admin"),q.sql)});return out;
}
export interface LeaderboardRow {
 earnings_rank:number;researcher_id:number;name:string;country:string|null;reputation_score:number;
 reports_submitted:number;accepted_reports:number;currency:string|null;total_earned:number;
}
export async function leaderboard(role:"ADMIN"|"RESEARCHER"):Promise<LeaderboardRow[]> {
 return select<LeaderboardRow>(getPool(role==="ADMIN"?"admin":"researcher"),
 "SELECT * FROM v_leaderboard_public ORDER BY currency,earnings_rank,name LIMIT 100");
}
export async function researcherDirectory() {
 return select<Row>(getPool("admin"),`SELECT r.researcher_id,r.name,r.email,r.country,r.reputation_score,
 l.currency,l.reports_submitted,l.accepted_reports,l.total_earned,l.earnings_rank,
 ROUND(100*l.accepted_reports/NULLIF(l.reports_submitted,0),1) acceptance_pct
 FROM RESEARCHER r LEFT JOIN v_leaderboard_public l ON l.researcher_id=r.researcher_id
 ORDER BY l.currency,l.earnings_rank,r.name`);
}
export async function adminDashboard() {
 const db=getPool("admin");
 const [counts,byStatus,bySeverity,payouts,recent]=await Promise.all([
  select<Row>(db,`SELECT (SELECT COUNT(*) FROM COMPANY) companies,
   (SELECT COUNT(*) FROM PROGRAM WHERE status='ACTIVE') active_programs,
   (SELECT COUNT(*) FROM VULNERABILITY) reports,
   (SELECT COUNT(*) FROM VULNERABILITY WHERE status='SUBMITTED') submitted,
   (SELECT COUNT(*) FROM VULNERABILITY WHERE status='TRIAGED') triaged,
   (SELECT COUNT(*) FROM VULNERABILITY WHERE status='ACCEPTED') accepted,
   (SELECT COUNT(*) FROM PATCH WHERE verification_status='VERIFIED') verified_patches,
   (SELECT COUNT(*) FROM PAYOUT WHERE payment_status='PENDING') pending_payouts`),
  select<Row>(db,"SELECT status,COUNT(*) total FROM VULNERABILITY GROUP BY status ORDER BY status"),
  select<Row>(db,"SELECT severity,COUNT(*) total FROM VULNERABILITY GROUP BY severity ORDER BY FIELD(severity,'CRITICAL','HIGH','MEDIUM','LOW')"),
  select<Row>(db,"SELECT currency,COUNT(*) payouts,SUM(CASE WHEN payment_status='COMPLETED' THEN amount ELSE 0 END) completed_total FROM PAYOUT GROUP BY currency ORDER BY currency"),
  select<Row>(db,`SELECT v.vuln_id,v.title,v.severity,v.status,v.submitted_date,r.name researcher_name
   FROM VULNERABILITY v JOIN RESEARCHER r ON r.researcher_id=v.researcher_id
   ORDER BY v.submitted_date DESC,v.vuln_id DESC LIMIT 8`)
 ]);
 return {counts:counts[0]??{},byStatus,bySeverity,payouts,recent};
}
