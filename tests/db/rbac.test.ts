import { afterAll,describe,expect,it } from "vitest";
import { closePools,getPool } from "@/server/db/pools";
import { select } from "@/server/db/query";
import { toAppError } from "@/server/errors";
import { errnoOf } from "../helpers";
afterAll(closePools);
describe("least-privilege MySQL accounts",()=>{
 it("researcher cannot read payout, emails or execute admin review",async()=>{
  expect(await errnoOf(select(getPool("researcher"),"SELECT * FROM PAYOUT LIMIT 1"))).toBe(1142);
  expect(await errnoOf(select(getPool("researcher"),"SELECT email FROM RESEARCHER LIMIT 1"))).toBe(1142);
  expect(await errnoOf(select(getPool("researcher"),"CALL sp_review_vulnerability(1,301,'ACCEPTED',NULL,NULL)"))).toBe(1370);
 });
 it("admin cannot read password hashes, delete payouts or change schema",async()=>{
  expect(await errnoOf(select(getPool("admin"),"SELECT password_hash FROM APP_USER LIMIT 1"))).toBe(1143);
  expect(await errnoOf(select(getPool("admin"),"DELETE FROM PAYOUT WHERE payout_id=-1"))).toBe(1142);
  expect(await errnoOf(select(getPool("admin"),"CREATE TABLE rbac_probe_should_fail(id INT)"))).toBe(1142);
  expect(await select(getPool("admin"),"SELECT email,role FROM APP_USER LIMIT 1")).toHaveLength(1);
 });
 it("vector and auth accounts are restricted to their boundary",async()=>{
  expect(await errnoOf(select(getPool("vector"),"UPDATE VULNERABILITY SET title='x' WHERE vuln_id=-1"))).toBe(1142);
  expect(await errnoOf(select(getPool("auth"),"SELECT * FROM VULNERABILITY LIMIT 1"))).toBe(1142);
 });
 it("researcher can read only the public leaderboard view",async()=>{
  const rows=await select(getPool("researcher"),"SELECT * FROM v_leaderboard_public LIMIT 1");
  if(rows.length)expect(Object.keys(rows[0])).not.toContain("email");
 });
 it("privilege errors map to HTTP 403",()=>expect(toAppError(Object.assign(new Error("denied"),{errno:1142})).status).toBe(403));
});
