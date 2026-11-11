// Application validation mirrors the database's ENUM, CHECK, FK and trigger rules.
import { z } from "zod";
export const SEVERITIES=["LOW","MEDIUM","HIGH","CRITICAL"] as const;
export const REPORT_STATUSES=["SUBMITTED","TRIAGED","ACCEPTED","REJECTED","DUPLICATE"] as const;
export const PROGRAM_STATUSES=["ACTIVE","PAUSED","CLOSED"] as const;
export const CURRENCIES=["USD","EUR","INR"] as const;
const trimmed=(min:number,max:number,label:string)=>z.string().trim()
  .min(min,`${label} must be at least ${min} characters`)
  .max(max,`${label} must be at most ${max} characters`);
const optionalText=(max:number)=>z.string().trim().max(max).optional().transform(v=>v?v:null);
export const loginSchema=z.object({
  email:z.email("Enter a valid e-mail").trim().toLowerCase(),
  password:z.string().min(1,"Password is required").max(200),
});
export const registerSchema=z.object({
  name:trimmed(2,100,"Name"),
  email:z.email("Enter a valid e-mail").trim().toLowerCase().max(100),
  country:optionalText(50),
  password:z.string().min(10,"Password must be at least 10 characters")
    .max(72,"Password must be at most 72 characters")
    .regex(/[A-Za-z]/,"Password needs a letter").regex(/[0-9]/,"Password needs a digit"),
});
export const companySchema=z.object({name:trimmed(2,100,"Company name"),industry:optionalText(50),website:optionalText(100)});
export const programSchema=z.object({name:trimmed(3,100,"Program name"),scope:optionalText(200),status:z.enum(PROGRAM_STATUSES).default("ACTIVE"),companyId:z.coerce.number().int().positive()});
export const programUpdateSchema=programSchema.omit({companyId:true});
const cvss=z.coerce.number().min(0,"CVSS must be between 0.0 and 10.0").max(10,"CVSS must be between 0.0 and 10.0")
  .refine(n=>Math.round(n*10)===n*10,"CVSS has one decimal place");
export const reportSchema=z.object({programId:z.coerce.number().int().positive(),title:trimmed(5,150,"Title"),description:trimmed(20,4000,"Description"),severity:z.enum(SEVERITIES),cvssScore:cvss});
export const reportUpdateSchema=reportSchema.omit({programId:true});
export const reviewSchema=z.object({decision:z.enum(["TRIAGED","ACCEPTED","REJECTED","DUPLICATE"]),duplicateOf:z.coerce.number().int().positive().optional(),note:optionalText(300)})
  .refine(v=>v.decision!=="DUPLICATE"||v.duplicateOf!==undefined,{message:"Choose the original report for a duplicate",path:["duplicateOf"]});
const isoDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/,"Use YYYY-MM-DD");
export const patchCreateSchema=z.object({vulnId:z.coerce.number().int().positive(),patchDate:isoDate,notes:optionalText(300)});
export const patchVerifySchema=z.object({result:z.enum(["VERIFIED","FAILED"]),notes:optionalText(300)});
export const payoutCreateSchema=z.object({vulnId:z.coerce.number().int().positive(),amount:z.coerce.number().positive("Amount must be greater than zero").max(99_999_999),currency:z.enum(CURRENCIES).default("USD")});
export const payoutCompleteSchema=z.object({result:z.enum(["COMPLETED","FAILED"]),paymentDate:isoDate.optional()});
export const reportFilterSchema=z.object({status:z.enum(REPORT_STATUSES).optional(),severity:z.enum(SEVERITIES).optional(),programId:z.coerce.number().int().positive().optional(),q:z.string().trim().max(200).optional()});
