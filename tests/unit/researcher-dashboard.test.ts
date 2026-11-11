import { describe, expect, it } from "vitest";
import {
  completedPayoutTotalsByCurrency,
  countResearcherReports,
  recentResearcherReports,
} from "@/lib/researcher-dashboard";

describe("researcher dashboard summaries", () => {
  it("counts pending and accepted reports without treating rejected reports as pending", () => {
    expect(countResearcherReports([
      { status: "SUBMITTED" },
      { status: "TRIAGED" },
      { status: "ACCEPTED" },
      { status: "REJECTED" },
    ])).toEqual({ total: 4, pending: 2, accepted: 1 });
  });

  it("aggregates completed payouts independently for each currency", () => {
    expect(completedPayoutTotalsByCurrency([
      { payment_status: "COMPLETED", currency: "INR", amount: "1200.00" },
      { payment_status: "COMPLETED", currency: "INR", amount: 800 },
      { payment_status: "COMPLETED", currency: "USD", amount: "25.50" },
      { payment_status: "PENDING", currency: "INR", amount: 500 },
    ])).toEqual({ INR: 2000, USD: 25.5 });
  });

  it("does not let malformed amounts poison currency totals", () => {
    expect(completedPayoutTotalsByCurrency([
      { payment_status: "COMPLETED", currency: "USD", amount: "not-a-number" },
      { payment_status: "COMPLETED", currency: "USD", amount: "10" },
    ])).toEqual({ USD: 10 });
  });

  it("returns newest reports first without mutating the caller's array", () => {
    const reports = [
      { id: 1, submitted_date: "2026-01-01" },
      { id: 2, submitted_date: "2026-03-01" },
      { id: 3, submitted_date: "2026-02-01" },
    ];
    expect(recentResearcherReports(reports, 2).map(report => report.id)).toEqual([2, 3]);
    expect(reports.map(report => report.id)).toEqual([1, 2, 3]);
  });
});
