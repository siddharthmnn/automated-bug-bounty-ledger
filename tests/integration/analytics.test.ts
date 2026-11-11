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
 it("returns dashboard totals and payout aggregates without cross-currency addition",async()=>{
  const data=await adminDashboard();
  expect(data.counts).toHaveProperty("reports");
  expect(Array.isArray(data.byStatus)).toBe(true);
  expect(Array.isArray(data.recent)).toBe(true);
  for(const payout of data.payouts)expect(["USD","EUR","INR"]).toContain((payout as Record<string,unknown>).currency);
 });
});
