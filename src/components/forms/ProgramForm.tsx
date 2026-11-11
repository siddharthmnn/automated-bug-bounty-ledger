"use client";
import { api,formValues } from "@/lib/api-client";
import { FormStatus,useAction } from "@/components/forms/useAction";
interface Program {program_id:number;name:string;scope:string|null;status:string;}
export function ProgramForm({program,companies,companyId}:{
 program?:Program;companies?:{company_id:number;name:string}[];companyId?:number;
}) {
 const {busy,error,message,run}=useAction();
 return <form className="grid gap-3 sm:grid-cols-2" onSubmit={async e=>{
  e.preventDefault();const form=e.currentTarget;const values=formValues(form);
  if(program)await run(()=>api("PATCH",`/api/programs/${program.program_id}`,values),{success:"Saved"});
  else {const ok=await run(()=>api("POST","/api/programs",values),{success:"Program created"});if(ok)form.reset();}
 }}>
  {!program&&<div><label className="label">Company</label><select className="input" name="companyId" defaultValue={companyId} required>
   {companies?.map(c=><option key={c.company_id} value={c.company_id}>{c.name}</option>)}
  </select></div>}
  <div><label className="label">Program name</label><input className="input" name="name" defaultValue={program?.name} required minLength={3} maxLength={100}/></div>
  <div><label className="label">Scope</label><input className="input" name="scope" defaultValue={program?.scope??""} maxLength={200} placeholder="e.g. api.example.com/*"/></div>
  <div><label className="label">Status</label><select className="input" name="status" defaultValue={program?.status??"ACTIVE"}><option>ACTIVE</option><option>PAUSED</option><option>CLOSED</option></select></div>
  <div className="flex items-end"><button className="btn btn-primary" disabled={busy}>{program?"Save program":"Create program"}</button></div>
  <div className="sm:col-span-2"><FormStatus error={error} message={message}/></div>
 </form>;
}
