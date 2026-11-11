import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const mocks = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  listMyReports: vi.fn(),
  listMyPayouts: vi.fn(),
  submitReport: vi.fn(),
  getMyReport: vi.fn(),
  getReportAdmin: vi.fn(),
  updateMyReport: vi.fn(),
  withdrawMyReport: vi.fn(),
  duplicateChain: vi.fn(),
  scheduleVectorSync: vi.fn(),
}));

vi.mock("@/server/auth/guard", () => ({ requireApiUser: mocks.requireApiUser }));
vi.mock("@/server/services/vulnerabilities", () => ({
  listMyReports: mocks.listMyReports,
  submitReport: mocks.submitReport,
  getMyReport: mocks.getMyReport,
  getReportAdmin: mocks.getReportAdmin,
  updateMyReport: mocks.updateMyReport,
  withdrawMyReport: mocks.withdrawMyReport,
  duplicateChain: mocks.duplicateChain,
}));
vi.mock("@/server/services/ledger", () => ({ listMyPayouts: mocks.listMyPayouts }));
vi.mock("@/server/vector/schedule", () => ({ scheduleVectorSync: mocks.scheduleVectorSync }));

import { GET as getMyReports } from "@/app/api/me/reports/route";
import { GET as getMyPayouts } from "@/app/api/me/payouts/route";
import { GET as getReport, PATCH as patchReport, DELETE as deleteReport } from "@/app/api/vulnerabilities/[id]/route";
import { GET as getReportHistory } from "@/app/api/vulnerabilities/[id]/history/route";
import { POST as submitReport } from "@/app/api/vulnerabilities/route";

const researcher = {
  userId: 41,
  email: "researcher@example.test",
  role: "RESEARCHER" as const,
  researcherId: 9,
  displayName: "Researcher One",
};
const admin = {
  userId: 1,
  email: "admin@example.test",
  role: "ADMIN" as const,
  researcherId: null,
  displayName: "Admin",
};
const request = (url: string, method = "GET", body?: unknown) =>
  new Request(url, {
    method,
    ...(body === undefined ? {} : {
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const payload = {
  programId: 7,
  title: "Stored XSS in profile field",
  description: "A crafted profile value executes script in another user's session.",
  severity: "HIGH",
  cvssScore: 7.5,
};

describe("researcher API route contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiUser.mockResolvedValue(researcher);
    mocks.listMyReports.mockResolvedValue([]);
    mocks.listMyPayouts.mockResolvedValue([]);
    mocks.submitReport.mockResolvedValue({ vulnId: 501 });
    mocks.getMyReport.mockResolvedValue({ report: { vuln_id: 501 }, history: [] });
    mocks.getReportAdmin.mockResolvedValue({ report: { vuln_id: 501 }, history: [] });
    mocks.updateMyReport.mockResolvedValue(undefined);
    mocks.withdrawMyReport.mockResolvedValue(undefined);
    mocks.duplicateChain.mockResolvedValue([]);
  });

  it("scopes report and payout collections to the authenticated researcher", async () => {
    const reports = await getMyReports(request("http://localhost/api/me/reports"));
    const payouts = await getMyPayouts(request("http://localhost/api/me/payouts"));

    expect(reports.status).toBe(200);
    expect(payouts.status).toBe(200);
    expect(mocks.requireApiUser).toHaveBeenNthCalledWith(1, "RESEARCHER");
    expect(mocks.requireApiUser).toHaveBeenNthCalledWith(2, "RESEARCHER");
    expect(mocks.listMyReports).toHaveBeenCalledWith(researcher);
    expect(mocks.listMyPayouts).toHaveBeenCalledWith(researcher);
  });

  it("does not call researcher services when authentication fails", async () => {
    mocks.requireApiUser.mockRejectedValueOnce(
      new AppError(401, "UNAUTHENTICATED", "Please log in"),
    );

    const response = await getMyReports(request("http://localhost/api/me/reports"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "UNAUTHENTICATED", message: "Please log in" },
    });
    expect(mocks.listMyReports).not.toHaveBeenCalled();
  });

  it("submits a report using the authenticated user, never a client-supplied owner id", async () => {
    const response = await submitReport(
      request("http://localhost/api/vulnerabilities", "POST", {
        ...payload,
        researcherId: 999,
        userId: 999,
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.requireApiUser).toHaveBeenCalledWith("RESEARCHER");
    expect(mocks.submitReport).toHaveBeenCalledWith(researcher, payload);
    expect(mocks.scheduleVectorSync).toHaveBeenCalledOnce();
  });

  it("returns a safe validation error for malformed report input", async () => {
    const response = await submitReport(
      request("http://localhost/api/vulnerabilities", "POST", { ...payload, cvssScore: 11 }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION");
    expect(mocks.submitReport).not.toHaveBeenCalled();
  });

  it("uses the researcher-owned detail service for non-admin report reads", async () => {
    const response = await getReport(
      request("http://localhost/api/vulnerabilities/501"),
      context("501"),
    );

    expect(response.status).toBe(200);
    expect(mocks.getMyReport).toHaveBeenCalledWith(researcher, 501);
    expect(mocks.getReportAdmin).not.toHaveBeenCalled();
  });

  it("uses the admin detail service only for an authenticated admin", async () => {
    mocks.requireApiUser.mockResolvedValueOnce(admin);

    const response = await getReport(
      request("http://localhost/api/vulnerabilities/501"),
      context("501"),
    );

    expect(response.status).toBe(200);
    expect(mocks.getReportAdmin).toHaveBeenCalledWith(501);
    expect(mocks.getMyReport).not.toHaveBeenCalled();
  });

  it("rejects malformed report identifiers before accessing services", async () => {
    const response = await getReport(
      request("http://localhost/api/vulnerabilities/0"),
      context("0"),
    );

    expect(response.status).toBe(400);
    expect(mocks.getMyReport).not.toHaveBeenCalled();
  });

  it("routes report edits and withdrawals through researcher-scoped commands", async () => {
    const update = await patchReport(
      request("http://localhost/api/vulnerabilities/501", "PATCH", {
        title: "Updated stored XSS report",
        description: "The proof of concept confirms script execution in a victim session.",
        severity: "HIGH",
        cvssScore: 7.5,
      }),
      context("501"),
    );
    const withdrawal = await deleteReport(
      request("http://localhost/api/vulnerabilities/501", "DELETE"),
      context("501"),
    );

    expect(update.status).toBe(200);
    expect(withdrawal.status).toBe(200);
    expect(mocks.updateMyReport).toHaveBeenCalledWith(researcher, 501, {
      title: "Updated stored XSS report",
      description: "The proof of concept confirms script execution in a victim session.",
      severity: "HIGH",
      cvssScore: 7.5,
    });
    expect(mocks.withdrawMyReport).toHaveBeenCalledWith(researcher, 501);
    expect(mocks.scheduleVectorSync).toHaveBeenCalledTimes(2);
  });

  it("does not expose duplicate-chain details to researcher history responses", async () => {
    const response = await getReportHistory(
      request("http://localhost/api/vulnerabilities/501/history"),
      context("501"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.history).toEqual([]);
    expect(body.data).not.toHaveProperty("chain");
    expect(mocks.duplicateChain).not.toHaveBeenCalled();
  });

  it("includes duplicate-chain details for admins only", async () => {
    mocks.requireApiUser.mockResolvedValueOnce(admin);
    mocks.duplicateChain.mockResolvedValueOnce([{ vuln_id: 502 }]);

    const response = await getReportHistory(
      request("http://localhost/api/vulnerabilities/501/history"),
      context("501"),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data.chain).toEqual([{ vuln_id: 502 }]);
    expect(mocks.getReportAdmin).toHaveBeenCalledWith(501);
    expect(mocks.duplicateChain).toHaveBeenCalledWith(501);
  });
});
