export interface ResearcherReportSummary {
  status: string;
}
export interface ResearcherPayoutSummary {
  payment_status: string;
  currency: string;
  amount: number | string;
}
export interface DatedResearcherReport {
  submitted_date: string;
}
export function countResearcherReports<T extends ResearcherReportSummary>(reports: T[]) {
  return {
    total: reports.length,
    pending: reports.filter(report => ["SUBMITTED", "TRIAGED"].includes(report.status)).length,
    accepted: reports.filter(report => report.status === "ACCEPTED").length,
  };
}
export function completedPayoutTotalsByCurrency<T extends ResearcherPayoutSummary>(
  payouts: T[],
): Record<string, number> {
  return payouts.reduce<Record<string, number>>((totals, payout) => {
    if (payout.payment_status !== "COMPLETED") return totals;
    const amount = Number(payout.amount);
    if (!Number.isFinite(amount)) return totals;
    totals[payout.currency] = (totals[payout.currency] ?? 0) + amount;
    return totals;
  }, {});
}
export function recentResearcherReports<T extends DatedResearcherReport>(
  reports: T[],
  limit = 6,
): T[] {
  return [...reports]
    .sort((a, b) => String(b.submitted_date).localeCompare(String(a.submitted_date)))
    .slice(0, Math.max(0, limit));
}
