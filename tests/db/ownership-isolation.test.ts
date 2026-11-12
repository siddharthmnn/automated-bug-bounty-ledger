import { afterAll, describe, expect, it } from "vitest";
import { closePools, getPool } from "@/server/db/pools";
import { callProcedure, select } from "@/server/db/query";
import { errnoOf } from "../helpers";

afterAll(closePools);

describe("researcher report and payout ownership isolation", () => {
  async function accounts() {
    const rows = await select<{ user_id: number; researcher_id: number }>(
      getPool("admin"),
      "SELECT user_id,researcher_id FROM APP_USER WHERE role='RESEARCHER' AND is_active=1 AND researcher_id IN (206,207) ORDER BY researcher_id",
    );
    expect(rows).toHaveLength(2);
    return { owner: rows[0], other: rows[1] };
  }

  it("scopes report collections and payout collections to the supplied authenticated user id", async () => {
    const { owner, other } = await accounts();
    const ownerReports = await callProcedure(getPool("researcher"), "sp_my_reports", [owner.user_id]);
    const otherReports = await callProcedure(getPool("researcher"), "sp_my_reports", [other.user_id]);
    const ownerPayouts = await callProcedure(getPool("researcher"), "sp_my_payouts", [owner.user_id]);
    const otherPayouts = await callProcedure(getPool("researcher"), "sp_my_payouts", [other.user_id]);

    const ownReportIds = (ownerReports[0] ?? []).map(row => Number(row.vuln_id));
    const otherReportIds = (otherReports[0] ?? []).map(row => Number(row.vuln_id));
    const ownPayoutIds = (ownerPayouts[0] ?? []).map(row => Number(row.payout_id));
    const otherPayoutIds = (otherPayouts[0] ?? []).map(row => Number(row.payout_id));

    expect(ownReportIds).toContain(305);
    expect(otherReportIds).not.toContain(305);
    expect(ownPayoutIds).toContain(503);
    expect(otherPayoutIds).not.toContain(503);
  });

  it("rejects cross-researcher report detail, update and withdrawal attempts", async () => {
    const { owner, other } = await accounts();
    expect(await errnoOf(callProcedure(
      getPool("researcher"),
      "sp_my_report_detail",
      [other.user_id, 305],
    ))).toBe(1644);

    expect(await errnoOf(callProcedure(
      getPool("researcher"),
      "sp_update_my_report",
      [other.user_id, 305, "Unauthorized title mutation", "This mutation must never be applied to another researcher's report.", "HIGH", 7.5],
    ))).toBe(1644);

    expect(await errnoOf(callProcedure(
      getPool("researcher"),
      "sp_withdraw_my_report",
      [other.user_id, 305],
    ))).toBe(1644);

    const stillOwned = await callProcedure(getPool("researcher"), "sp_my_report_detail", [owner.user_id, 305]);
    expect(Number(stillOwned[0]?.[0]?.vuln_id)).toBe(305);
    expect(String(stillOwned[0]?.[0]?.title)).not.toBe("Unauthorized title mutation");
  });

  it("returns no rows for a nonexistent authenticated user id", async () => {
    const reports = await callProcedure(getPool("researcher"), "sp_my_reports", [2147483647]);
    const payouts = await callProcedure(getPool("researcher"), "sp_my_payouts", [2147483647]);
    expect(reports[0] ?? []).toHaveLength(0);
    expect(payouts[0] ?? []).toHaveLength(0);
  });
});
