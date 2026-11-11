import { describe,expect,it } from "vitest";
import { envSchema } from "@/server/env";

const validEnv={
  MYSQL_DATABASE:"bug_bounty_ledger",
  DB_AUTH_USER:"app_auth",DB_AUTH_PASSWORD:"a".repeat(64),
  DB_ADMIN_USER:"app_admin",DB_ADMIN_PASSWORD:"b".repeat(64),
  DB_RESEARCHER_USER:"app_researcher",DB_RESEARCHER_PASSWORD:"c".repeat(64),
  DB_VECTOR_USER:"app_vector",DB_VECTOR_PASSWORD:"d".repeat(64),
};

describe("server environment validation",()=>{
  it("accepts distinct generated hex credentials and applies safe defaults",()=>{
    const parsed=envSchema.parse(validEnv);
    expect(parsed.MYSQL_PORT).toBe(3307);
    expect(parsed.SESSION_TTL_HOURS).toBe(8);
    expect(parsed.EMBEDDING_DIM).toBe(384);
  });
  it("rejects placeholder, short and non-hex database passwords",()=>{
    for(const password of ["change-me","short","g".repeat(64),""]) {
      expect(envSchema.safeParse({...validEnv,DB_ADMIN_PASSWORD:password}).success).toBe(false);
    }
  });
  it("rejects reuse of a credential across database roles",()=>{
    expect(envSchema.safeParse({...validEnv,DB_VECTOR_PASSWORD:validEnv.DB_ADMIN_PASSWORD}).success).toBe(false);
  });
  it("rejects missing database identity and invalid numeric configuration",()=>{
    expect(envSchema.safeParse({...validEnv,MYSQL_DATABASE:""}).success).toBe(false);
    expect(envSchema.safeParse({...validEnv,MYSQL_PORT:"0"}).success).toBe(false);
    expect(envSchema.safeParse({...validEnv,SESSION_TTL_HOURS:"-1"}).success).toBe(false);
  });
});
