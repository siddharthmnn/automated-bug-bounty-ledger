"use client";
import { api,formValues } from "@/lib/api-client";
import { FormStatus,useAction } from "@/components/forms/useAction";
const today=()=>new Date().toISOString().slice(0,10);
export function RecordPatchForm({vulnId}:{vulnId:number}) {
 const {busy,error,run}=useAction();
 return <form className="flex flex-wrap items-end gap-2" onSubmit={async e=>{
  e.preventDefault();const values=formValues(e.currentTarget);
  await run(()=>api("POST","/api/patches",{...values,vulnId}),{success:"Patch recorded"});
 }}>
  <input className="input w-36" type="date" name="patchDate" defaultValue={today()} max={today()} required/>
  <input className="input w-56" name="notes" placeholder="Fix summary" maxLength={300}/>
  <button className="btn btn-sm btn-primary" disabled={busy}>Record patch</button>
  <div className="w-full"><FormStatus error={error}/></div>
 </form>;
}
export function VerifyPatchButtons({patchId}:{patchId:number}) {
 const {busy,error,run}=useAction();
 return <div className="space-y-1"><div className="flex gap-2">
  <button className="btn btn-sm btn-primary" disabled={busy} onClick={()=>run(()=>api("POST","/api/patches/"+patchId+"/verify",{result:"VERIFIED"}),{success:"Patch verified"})}>Verify</button>
  <button className="btn btn-sm btn-danger" disabled={busy} onClick={()=>run(()=>api("POST","/api/patches/"+patchId+"/verify",{result:"FAILED"}),{success:"Verification failed"})}>Fail</button>
 </div><FormStatus error={error}/></div>;
}
export function CreatePayoutForm({vulnId}:{vulnId:number}) {
 const {busy,error,run}=useAction();
 return <form className="flex flex-wrap items-end gap-2" onSubmit={async e=>{
  e.preventDefault();const values=formValues(e.currentTarget);
  await run(()=>api("POST","/api/payouts",{...values,vulnId}),{success:"Payout created"});
 }}>
  <input className="input w-28" type="number" name="amount" min="0.01" step="0.01" placeholder="Amount" required/>
  <select className="input w-24" name="currency" defaultValue="USD"><option>USD</option><option>EUR</option><option>INR</option></select>
  <button className="btn btn-sm btn-primary" disabled={busy}>Create payout</button>
  <div className="w-full"><FormStatus error={error}/></div>
 </form>;
}
export function CompletePayoutButtons({payoutId}:{payoutId:number}) {
 const {busy,error,run}=useAction();
 return <div className="space-y-1"><div className="flex gap-2">
  <button className="btn btn-sm btn-primary" disabled={busy} onClick={()=>run(()=>api("POST","/api/payouts/"+payoutId+"/complete",{result:"COMPLETED",paymentDate:today()}),{success:"Payout completed"})}>Mark paid</button>
  <button className="btn btn-sm btn-danger" disabled={busy} onClick={()=>run(()=>api("POST","/api/payouts/"+payoutId+"/complete",{result:"FAILED"}),{success:"Payout marked failed"})}>Failed</button>
 </div><FormStatus error={error}/></div>;
}
