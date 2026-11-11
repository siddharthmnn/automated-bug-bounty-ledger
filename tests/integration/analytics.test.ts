import { afterAll,describe,expect,it } from "vitest";
import { closePools,getPool } from "@/server/db/pools";
import { callProcedure,select } from "@/server/db/query";
import { adminDashboard,leaderboard,runAllCatalogueQueries } from "@/server/services/analytics";
import { listCompanies } from "@/server/services/companies";
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
 it("does not expose a mixed-currency scalar and partitions program/company totals",async()=>{
  const accounts=await select<{user_id:number;researcher_id:number}>(getPool("admin"),
   "SELECT user_id,researcher_id FROM APP_USER WHERE email='ananya@example.com' AND role='RESEARCHER' AND is_active=1");
  const admins=await select<{user_id:number}>(getPool("admin"),
   "SELECT user_id FROM APP_USER WHERE email='admin@ledger.example' AND role='ADMIN' AND is_active=1");
  const programs=await select<{program_id:number;company_id:number}>(getPool("admin"),
   "SELECT p.program_id,p.company_id FROM PROGRAM p JOIN VULNERABILITY v ON v.program_id=p.program_id JOIN PAYOUT py ON py.vuln_id=v.vuln_id WHERE p.status='ACTIVE' AND v.researcher_id=? AND py.currency='USD' LIMIT 1",
   [accounts[0]?.researcher_id]);
  expect(accounts).toHaveLength(1);expect(admins).toHaveLength(1);expect(programs).toHaveLength(1);
  const [submitted]=await callProcedure(getPool("researcher"),"sp_submit_vulnerability",[
   accounts[0].user_id,programs[0].program_id,"Cross currency analytics fixture",
   "Synthetic integration fixture to verify currency partitioning across researcher, program and company aggregates.",
   "HIGH",8.1
  ]);
  const vulnId=Number(submitted?.[0]?.vuln_id);expect(vulnId).toBeGreaterThan(0);
  await callProcedure(getPool("admin"),"sp_review_vulnerability",[
   admins[0].user_id,vulnId,"ACCEPTED",null,"currency aggregation integration test"
  ]);
  const beforeProgramTotals=await select<{currency:string;total_paid:number}>(getPool("admin"),
   "SELECT currency,total_paid FROM v_program_stats WHERE program_id=? ORDER BY currency",[programs[0].program_id]);
  const priorInr=beforeProgramTotals.find(x=>x.currency==="INR")?.total_paid??0;
  const [created]=await callProcedure(getPool("admin"),"sp_create_payout",[vulnId,125.5,"INR"]);
  const payoutId=Number(created?.[0]?.payout_id);expect(payoutId).toBeGreaterThan(0);
  await callProcedure(getPool("admin"),"sp_complete_payout",[payoutId,"COMPLETED","2026-11-12"]);
  const scalar=await select<{earnings:number|null}>(getPool("admin"),
   "SELECT fn_researcher_earnings(?) earnings",[accounts[0].researcher_id]);
  expect(scalar[0].earnings).toBeNull();
  const programTotals=await select<{currency:string;total_paid:number}>(getPool("admin"),
   "SELECT currency,total_paid FROM v_program_stats WHERE program_id=? ORDER BY currency",[programs[0].program_id]);
  expect(programTotals.map(x=>x.currency)).toContain("USD");
  expect(programTotals.map(x=>x.currency)).toContain("INR");
  expect(programTotals.find(x=>x.currency==="INR")?.total_paid).toBe(priorInr+125.5);
  const company= (await listCompanies()).find(x=>x.company_id===programs[0].company_id);
  expect(company?.paid_by_currency).toContain("USD");
  expect(company?.paid_by_currency).toContain("INR");
 });
});
