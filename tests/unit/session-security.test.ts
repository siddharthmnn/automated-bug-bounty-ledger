import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  selectOne: vi.fn(),
  getPool: vi.fn(() => ({ kind: "auth-pool" })),
  cookies: vi.fn(),
  revokeSession: vi.fn(),
  requireApiUser: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/server/db/pools", () => ({ getPool: mocks.getPool }));
vi.mock("@/server/db/query", () => ({
  execute: mocks.execute,
  selectOne: mocks.selectOne,
}));
vi.mock("@/server/env", () => ({
  env: () => ({ SESSION_TTL_HOURS: 8 }),
}));
vi.mock("@/server/auth/guard", () => ({
  requireApiUser: mocks.requireApiUser,
}));

import {
  createSession,
  findSessionUser,
  getCurrentUser,
  revokeSession,
  sessionCookieOptions,
} from "@/server/auth/session";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as currentUser } from "@/app/api/auth/me/route";

const researcherRow = {
  user_id: 41,
  email: "researcher@example.test",
  role: "RESEARCHER" as const,
  researcher_id: 9,
  display_name: "Researcher One",
};

describe("session persistence and validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.execute.mockResolvedValue(undefined);
    mocks.selectOne.mockResolvedValue(researcherRow);
    mocks.cookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-session-token" }),
    });
  });

  it("creates an opaque token and persists only its SHA-256 digest", async () => {
    const before = Date.now();
    const session = await createSession(41);
    const after = Date.now();

    expect(session.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(session.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 8 * 60 * 60 * 1000);
    expect(session.expiresAt.getTime()).toBeLessThanOrEqual(after + 8 * 60 * 60 * 1000);
    expect(mocks.execute).toHaveBeenCalledOnce();
    const [pool, sql, params] = mocks.execute.mock.calls[0];
    expect(pool).toEqual({ kind: "auth-pool" });
    expect(sql).toContain("INSERT INTO USER_SESSION");
    expect(params[0]).toBe(41);
    expect(params[1]).not.toBe(session.token);
    expect(params[1]).toMatch(/^[a-f0-9]{64}$/);
    expect(params).not.toContain(session.token);
  });

  it("maps a valid database session to the minimal application identity", async () => {
    const user = await findSessionUser("valid-session-token");

    expect(user).toEqual({
      userId: 41,
      email: "researcher@example.test",
      role: "RESEARCHER",
      researcherId: 9,
      displayName: "Researcher One",
    });
    const [, sql, params] = mocks.selectOne.mock.calls[0];
    expect(sql).toContain("s.revoked_at IS NULL");
    expect(sql).toContain("s.expires_at>NOW()");
    expect(sql).toContain("u.is_active");
    expect(params).toEqual([expect.stringMatching(/^[a-f0-9]{64}$/)]);
    expect(params).not.toContain("valid-session-token");
  });

  it.each([
    ["missing database row", null],
    ["revoked session", null],
    ["expired session", null],
    ["inactive account", null],
  ])("returns no identity for %s", async (_label, row) => {
    mocks.selectOne.mockResolvedValueOnce(row);
    await expect(findSessionUser("unusable-token")).resolves.toBeNull();
  });

  it("revokes a session by digest, without persisting the raw token", async () => {
    await revokeSession("valid-session-token");

    const [, sql, params] = mocks.execute.mock.calls[0];
    expect(sql).toContain("UPDATE USER_SESSION SET revoked_at=NOW()");
    expect(sql).toContain("revoked_at IS NULL");
    expect(params).toEqual([expect.stringMatching(/^[a-f0-9]{64}$/)]);
    expect(params).not.toContain("valid-session-token");
  });

  it("reads the session cookie and resolves it through the database", async () => {
    await expect(getCurrentUser()).resolves.toMatchObject({ userId: 41 });
    expect(mocks.cookies).toHaveBeenCalledOnce();
    expect(mocks.selectOne).toHaveBeenCalledOnce();
  });

  it("sets secure, HttpOnly, SameSite=Lax cookie attributes in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const options = sessionCookieOptions(new Date("2026-12-01T00:00:00Z"));
    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
    vi.unstubAllEnvs();
  });

  it("does not mark cookies secure in local development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(sessionCookieOptions(new Date()).secure).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe("authentication route boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.execute.mockResolvedValue(undefined);
    mocks.cookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-session-token" }),
    });
    mocks.requireApiUser.mockResolvedValue({
      userId: 41,
      email: "researcher@example.test",
      role: "RESEARCHER",
      researcherId: 9,
      displayName: "Researcher One",
    });
  });

  it("logout revokes the server-side session and clears the browser cookie", async () => {
    const response = await logout(new Request("http://localhost/api/auth/logout", { method: "POST" }), {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { loggedOut: true } });
    expect(mocks.execute).toHaveBeenCalledOnce();
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("abbl_session=");
    expect(cookie.toLowerCase()).toContain("expires=");
  });

  it("logout remains idempotent when the cookie is absent", async () => {
    mocks.cookies.mockResolvedValueOnce({ get: vi.fn().mockReturnValue(undefined) });

    const response = await logout(new Request("http://localhost/api/auth/logout", { method: "POST" }), {});

    expect(response.status).toBe(200);
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("returns the authenticated identity from /api/auth/me", async () => {
    const response = await currentUser(new Request("http://localhost/api/auth/me"), {});

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { userId: 41, role: "RESEARCHER", researcherId: 9 },
    });
    expect(mocks.requireApiUser).toHaveBeenCalledOnce();
  });

  it("returns 401 when /api/auth/me has no authenticated session", async () => {
    mocks.requireApiUser.mockRejectedValueOnce(
      new AppError(401, "UNAUTHENTICATED", "Please log in"),
    );

    const response = await currentUser(new Request("http://localhost/api/auth/me"), {});

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "UNAUTHENTICATED", message: "Please log in" },
    });
  });
});
