import { afterAll,describe,expect,it } from "vitest";
import { closePools,getPool } from "@/server/db/pools";
import { select } from "@/server/db/query";
import { adminDashboard,leaderboard,runAllCatalogueQueries } from "@/server/services/analytics";
afterAll(closePools);
describe("currency-safe analytics and dashboard read models",()=>{
 it("executes all twelve advanced SQL catalogue queries",async()=>{
  const results=await runAllCatalogueQueries();
  expect(results.map(q=>q.id)).toEqual(["Q01","Q02","Q03","Q04","Q05","Q06","Q07","Q08","Q09","Q10","Q11","Q12"]);
  expect(results.every(q=>Array.isArray(q.rows))).toBe(true);
 });
 it("keeps leaderboard earnings separated by currency",async()=>{
  const rows=await leaderboard("RESEARCHER");
  for(const row of rows)expect(["USD","EUR","INR",null]).toContain(row.currency);
  const view=await select<Record<string,unknown>>(getPool("researcher"),"SELECT * FROM v_leaderboard_public LIMIT 1");
  if(view.length)expect(Object.keys(view[0])).toContain("currency");
 });
 it("returns dashboard payout aggregates grouped by currency",async()=>{
  const data=await adminDashboard();
  expect(data.counts).toHaveProperty("reports");
  expect(Array.isArray(data.byStatus)).toBe(true);
  expect(Array.isArray(data.recent)).toBe(true);
  const expected=await select<{currency:string;total:number}>(getPool("admin"),
   "SELECT currency,SUM(CASE WHEN payment_status='COMPLETED' THEN amount ELSE 0 END) total FROM PAYOUT GROUP BY currency ORDER BY currency");
  expect(data.payouts).toEqual(expect.arrayContaining(expected.map(x=>expect.objectContaining({currency:x.currency,completed_total:x.total}))));
 });
 it("never returns a misleading scalar for multi-currency researcher earnings",async()=>{
  const researchers=await select<{researcher_id:number;currency_count:number}>(getPool("admin"),
   "SELECT v.researcher_id,COUNT(DISTINCT p.currency) currency_count FROM VULNERABILITY v JOIN PAYOUT p ON p.vuln_id=v.vuln_id WHERE p.payment_status='COMPLETED' GROUP BY v.researcher_id HAVING COUNT(DISTINCT p.currency)>1 LIMIT 1");
  if(researchers.length){
   const result=await select<{earnings:number|null}>(getPool("admin"),
    "SELECT fn_researcher_earnings(?) earnings",[researchers[0].researcher_id]);
   expect(result[0].earnings).toBeNull();
  }
 });
 it("keeps program payouts separated by currency",async()=>{
  const rows=await select<{program_id:number;currency:string|null;total_paid:number}>(getPool("admin"),
   "SELECT * FROM v_program_stats ORDER BY program_id,currency");
  for(const row of rows) if(row.currency!==null) expect(["USD","EUR","INR"]).toContain(row.currency);
  const grouped=await select<{program_id:number;currency:string;total:number}>(getPool("admin"),
   "SELECT v.program_id,p.currency,SUM(p.amount) total FROM PAYOUT p JOIN VULNERABILITY v ON v.vuln_id=p.vuln_id WHERE p.payment_status='COMPLETED' GROUP BY v.program_id,p.currency");
  for(const item of grouped){
   const match=rows.find(x=>x.program_id===item.program_id&&x.currency===item.currency);
   expect(match?.total_paid).toBe(item.total);
  }
 });
});
