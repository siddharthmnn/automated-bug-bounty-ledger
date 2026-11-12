import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error("NEXT_REDIRECT:" + path);
  }),
}));

vi.mock("@/server/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { homeFor, requireApiUser, requirePageUser } from "@/server/auth/guard";

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
  displayName: "Platform Admin",
};

describe("role and session guards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects missing, expired, revoked and invalid sessions as unauthenticated", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    await expect(requireApiUser()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHENTICATED",
    });
    expect(mocks.getCurrentUser).toHaveBeenCalledOnce();
  });

  it("rejects a valid session with the wrong role as forbidden", async () => {
    mocks.getCurrentUser.mockResolvedValue(researcher);
    await expect(requireApiUser("ADMIN")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("returns the identity when the required role matches", async () => {
    mocks.getCurrentUser.mockResolvedValue(researcher);
    await expect(requireApiUser("RESEARCHER")).resolves.toEqual(researcher);
  });

  it("allows either authenticated role when no role is requested", async () => {
    mocks.getCurrentUser.mockResolvedValue(admin);
    await expect(requireApiUser()).resolves.toEqual(admin);
  });

  it("redirects anonymous page requests to login", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    await expect(requirePageUser("RESEARCHER")).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects a researcher away from admin pages to their own home", async () => {
    mocks.getCurrentUser.mockResolvedValue(researcher);
    await expect(requirePageUser("ADMIN")).rejects.toThrow("NEXT_REDIRECT:/researcher");
  });

  it("maps role destinations consistently", () => {
    expect(homeFor("ADMIN")).toBe("/admin");
    expect(homeFor("RESEARCHER")).toBe("/researcher");
  });
});
