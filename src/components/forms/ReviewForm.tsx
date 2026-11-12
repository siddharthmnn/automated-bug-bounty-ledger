"use client";
import { useState } from "react";
import { api,formValues } from "@/lib/api-client";
import { FormStatus,useAction } from "@/components/forms/useAction";
export function ReviewForm({vulnId,status,candidates}:{
 vulnId:number;status:string;candidates:{vuln_id:number;title:string;status:string}[];
}) {
 const {busy,error,message,run}=useAction();
 const [decision,setDecision]=useState(status==="SUBMITTED"?"TRIAGED":"ACCEPTED");
 if(!["SUBMITTED","TRIAGED"].includes(status))return <p className="text-sm text-muted">This report has a final decision ({status}).</p>;
 return <form className="space-y-3" onSubmit={async e=>{
  e.preventDefault();await run(()=>api("POST",`/api/vulnerabilities/${vulnId}/review`,formValues(e.currentTarget)),{success:"Decision saved"});
 }}>
  <div><label className="label" htmlFor={`review-decision-${vulnId}`}>Decision</label><select id={`review-decision-${vulnId}`} className="input" name="decision" value={decision} onChange={e=>setDecision(e.target.value)}>
   {status==="SUBMITTED"&&<option value="TRIAGED">Triage (valid, needs analysis)</option>}
   <option value="ACCEPTED">Accept</option><option value="REJECTED">Reject</option><option value="DUPLICATE">Mark as duplicate</option>
  </select></div>
  {decision==="DUPLICATE"&&<div><label className="label" htmlFor={`review-duplicate-${vulnId}`}>Original report (same program)</label><select id={`review-duplicate-${vulnId}`} className="input" name="duplicateOf" required>
   {candidates.length===0?<option value="">No eligible originals</option>:null}
   {candidates.map(c=><option key={c.vuln_id} value={c.vuln_id}>#{c.vuln_id} {c.title} ({c.status})</option>)}
  </select></div>}
  <div><label className="label" htmlFor={`review-note-${vulnId}`}>Note (saved in status history)</label><input id={`review-note-${vulnId}`} className="input" name="note" maxLength={300}/></div>
  <FormStatus error={error} message={message}/><button className="btn btn-primary" disabled={busy}>Save decision</button>
 </form>;
}
