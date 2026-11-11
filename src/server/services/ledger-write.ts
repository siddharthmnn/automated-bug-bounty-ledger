// All patch/payout writes go through DEFINER procedures; business rules live in MySQL.
import type { z } from "zod";
import { getPool } from "@/server/db/pools";
import { callProcedure } from "@/server/db/query";
import type { SessionUser } from "@/server/auth/session";
import type { patchCreateSchema,patchVerifySchema,payoutCompleteSchema,payoutCreateSchema } from "@/server/validation/schemas";
export async function recordPatch(input:z.infer<typeof patchCreateSchema>) {
 const [rows]=await callProcedure(getPool("admin"),"sp_record_patch",[input.vulnId,input.patchDate,input.notes]);
 return {patchId:Number(rows?.[0]?.patch_id)};
}
export async function verifyPatch(admin:SessionUser,patchId:number,input:z.infer<typeof patchVerifySchema>) {
 await callProcedure(getPool("admin"),"sp_verify_patch",[patchId,input.result,admin.displayName,input.notes]);
}
export async function createPayout(input:z.infer<typeof payoutCreateSchema>) {
 const [rows]=await callProcedure(getPool("admin"),"sp_create_payout",[input.vulnId,input.amount,input.currency]);
 return {payoutId:Number(rows?.[0]?.payout_id)};
}
export async function completePayout(payoutId:number,input:z.infer<typeof payoutCompleteSchema>) {
 await callProcedure(getPool("admin"),"sp_complete_payout",[payoutId,input.result,input.paymentDate??null]);
}
