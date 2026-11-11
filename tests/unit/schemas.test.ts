import { describe,expect,it } from "vitest";
import { registerSchema,reportSchema,reviewSchema,payoutCreateSchema } from "@/server/validation/schemas";
const report={programId:"101",title:"IDOR on invoices",description:"Changing the id parameter returns another tenant's invoice.",severity:"HIGH",cvssScore:"7.5"};
describe("validation schemas",()=>{
 it("accepts valid reports and coerces numbers",()=>{const r=reportSchema.parse(report);expect(r.programId).toBe(101);expect(r.cvssScore).toBe(7.5);});
 it("rejects invalid CVSS scores",()=>{expect(reportSchema.safeParse({...report,cvssScore:"10.5"}).success).toBe(false);expect(reportSchema.safeParse({...report,cvssScore:"7.25"}).success).toBe(false);});
 it("rejects unknown severities",()=>expect(reportSchema.safeParse({...report,severity:"URGENT"}).success).toBe(false));
 it("requires a source report for duplicates",()=>{expect(reviewSchema.safeParse({decision:"DUPLICATE"}).success).toBe(false);expect(reviewSchema.safeParse({decision:"DUPLICATE",duplicateOf:"301"}).success).toBe(true);});
 it("normalizes e-mail and enforces password rules",()=>{const base={name:"Test User",email:"Test@Example.com",password:"longpassword1"};expect(registerSchema.parse(base).email).toBe("test@example.com");expect(registerSchema.safeParse({...base,password:"short1"}).success).toBe(false);expect(registerSchema.safeParse({...base,password:"onlyletterslong"}).success).toBe(false);});
 it("rejects invalid payout amounts and currencies",()=>{expect(payoutCreateSchema.safeParse({vulnId:1,amount:0}).success).toBe(false);expect(payoutCreateSchema.safeParse({vulnId:1,amount:10,currency:"BTC"}).success).toBe(false);});
});
