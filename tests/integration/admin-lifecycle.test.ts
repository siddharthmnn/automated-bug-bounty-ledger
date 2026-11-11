import { afterAll,describe,expect,it } from "vitest";
import { closePools,getPool } from "@/server/db/pools";
import { callProcedure,select } from "@/server/db/query";
import { errnoOf } from "../helpers";

afterAll(closePools);

async function fixture() {
  const [researchers,admins,programs]=await Promise.all([
    select<{user_id:number;researcher_id:number}>(getPool("admin"),
      "SELECT user_id,researcher_id FROM APP_USER WHERE email='ananya@example.com' AND role='RESEARCHER' AND is_active=1"),
    select<{user_id:number}>(getPool("admin"),
      "SELECT user_id FROM APP_USER WHERE email='admin@ledger.example' AND role='ADMIN' AND is_active=1"),
    select<{program_id:number}>(getPool("admin"),
      "SELECT program_id FROM PROGRAM WHERE status='ACTIVE' ORDER BY program_id LIMIT 1"),
  ]);
  expect(researchers).toHaveLength(1);
  expect(admins).toHaveLength(1);
  expect(programs.length).toBeGreaterThan(0);
  const [submitted]=await callProcedure(getPool("researcher"),"sp_submit_vulnerability",[
    researchers[0].user_id,programs[0].program_id,
    "Admin lifecycle regression fixture",
    "Synthetic integration fixture for validating guarded admin transitions and ledger operations.",
    "HIGH",8.1,
  ]);
  const vulnId=Number(submitted?.[0]?.vuln_id);
  expect(vulnId).toBeGreaterThan(0);
  return {vulnId,adminId:admins[0].user_id};
}

describe("admin report, patch and payout lifecycle guards",()=>{
  it("rejects final decisions from an invalid starting state and permits the intended path",async()=>{
    const {vulnId,adminId}=await fixture();
    expect(await errnoOf(callProcedure(getPool("admin"),"sp_review_vulnerability",[
      adminId,vulnId,"REJECTED",null,"must not skip triage",
    ]))).toBe(1644);
    await callProcedure(getPool("admin"),"sp_review_vulnerability",[
      adminId,vulnId,"TRIAGED",null,"initial triage",
    ]);
    await callProcedure(getPool("admin"),"sp_review_vulnerability",[
      adminId,vulnId,"ACCEPTED",null,"accepted after triage",
    ]);
    expect(await errnoOf(callProcedure(getPool("admin"),"sp_review_vulnerability",[
      adminId,vulnId,"REJECTED",null,"final decision cannot be rewritten",
    ]))).toBe(1644);
    const rows=await select<{status:string}>(getPool("admin"),
      "SELECT status FROM VULNERABILITY WHERE vuln_id=?",[vulnId]);
    expect(rows[0]?.status).toBe("ACCEPTED");
  });

  it("prevents patches and payouts before acceptance, then rejects repeated verification/completion",async()=>{
    const {vulnId,adminId}=await fixture();
    expect(await errnoOf(callProcedure(getPool("admin"),"sp_record_patch",[
      vulnId,new Date().toISOString().slice(0,10),"must not patch a submitted report",
    ]))).toBe(1644);
    expect(await errnoOf(callProcedure(getPool("admin"),"sp_create_payout",[
      vulnId,100,"INR",
    ]))).toBe(1644);

    await callProcedure(getPool("admin"),"sp_review_vulnerability",[
      adminId,vulnId,"ACCEPTED",null,"accepted for ledger test",
    ]);
    const [patchRows]=await callProcedure(getPool("admin"),"sp_record_patch",[
      vulnId,new Date().toISOString().slice(0,10),"valid accepted-report patch",
    ]);
    const patchId=Number(patchRows?.[0]?.patch_id);
    expect(patchId).toBeGreaterThan(0);
    await callProcedure(getPool("admin"),"sp_verify_patch",[
      patchId,"VERIFIED","integration-test","first verification",
    ]);
    expect(await errnoOf(callProcedure(getPool("admin"),"sp_verify_patch",[
      patchId,"FAILED","integration-test","verification is terminal",
    ]))).toBe(1644);

    expect(await errnoOf(callProcedure(getPool("admin"),"sp_create_payout",[
      vulnId,0,"INR",
    ]))).toBe(1644);
    const [payoutRows]=await callProcedure(getPool("admin"),"sp_create_payout",[
      vulnId,125.5,"INR",
    ]);
    const payoutId=Number(payoutRows?.[0]?.payout_id);
    expect(payoutId).toBeGreaterThan(0);
    await callProcedure(getPool("admin"),"sp_complete_payout",[
      payoutId,"COMPLETED",new Date().toISOString().slice(0,10),
    ]);
    expect(await errnoOf(callProcedure(getPool("admin"),"sp_complete_payout",[
      payoutId,"FAILED",null,
    ]))).toBe(1644);

    const [patch,payout]=await Promise.all([
      select<{verification_status:string}>(getPool("admin"),
        "SELECT verification_status FROM PATCH WHERE patch_id=?",[patchId]),
      select<{payment_status:string;currency:string;amount:number}>(getPool("admin"),
        "SELECT payment_status,currency,amount FROM PAYOUT WHERE payout_id=?",[payoutId]),
    ]);
    expect(patch[0]?.verification_status).toBe("VERIFIED");
    expect(payout[0]).toMatchObject({payment_status:"COMPLETED",currency:"INR",amount:125.5});
  });
});
