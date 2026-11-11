import { describe,expect,it } from "vitest";
import { hashToken,newSessionToken } from "@/server/auth/tokens";
import { AppError,toAppError } from "@/server/errors";
describe("session tokens",()=>{
 it("creates random 43-character base64url tokens",()=>{const a=newSessionToken();expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);expect(newSessionToken()).not.toBe(a);});
 it("stores only a SHA-256 digest",()=>expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"));
});
describe("MySQL error mapping",()=>{
 const mysql=(errno:number,sqlMessage="raw")=>Object.assign(new Error(sqlMessage),{errno,sqlMessage});
 it("maps SIGNAL to 409",()=>{const e=toAppError(mysql(1644,"Only ACCEPTED reports can be patched"));expect([e.status,e.code,e.message]).toEqual([409,"RULE_VIOLATION","Only ACCEPTED reports can be patched"]);});
 it("maps privilege errors to 403 without leaking account names",()=>{for(const errno of [1142,1143,1370]){const e=toAppError(mysql(errno,"SELECT denied to app_researcher"));expect(e.status).toBe(403);expect(e.message).not.toContain("app_researcher");}});
 it("maps constraints and unknown errors",()=>{expect(toAppError(mysql(3819)).status).toBe(400);expect(toAppError(mysql(1062)).status).toBe(409);expect(toAppError(new Error("boom")).status).toBe(500);expect(toAppError(new AppError(404,"NOT_FOUND","x")).status).toBe(404);});
});
