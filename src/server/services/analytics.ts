import { getPool } from "@/server/db/pools";
import { select,type Row } from "@/server/db/query";
import type { SessionUser } from "@/server/auth/session";
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
 reports_submitted:number;accepted_reports:number;total_earned:number;
}
export async function leaderboard(role:"ADMIN"|"RESEARCHER"):Promise<LeaderboardRow[]> {
 return select<LeaderboardRow>(getPool(role==="ADMIN"?"admin":"researcher"),
 "SELECT * FROM v_leaderboard_public ORDER BY earnings_rank,name LIMIT 50");
}
export async function researcherDirectory() {
 return select<Row>(getPool("admin"),`SELECT r.researcher_id,r.name,r.email,r.country,r.reputation_score,
 l.reports_submitted,l.accepted_reports,l.total_earned,l.earnings_rank,
 ROUND(100*l.accepted_reports/NULLIF(l.reports_submitted,0),1) acceptance_pct
 FROM RESEARCHER r JOIN v_leaderboard_public l ON l.researcher_id=r.researcher_id
 ORDER BY l.earnings_rank,r.name`);
}
