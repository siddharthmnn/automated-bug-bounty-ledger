"use client";
import { useRouter } from "next/navigation";
import { api,formValues } from "@/lib/api-client";
import { FormStatus,useAction } from "@/components/forms/useAction";
interface Report {vuln_id:number;title:string;description:string|null;severity:string;cvss_score:number|null;}
export function ReportForm({programs,defaultProgramId,report}:{
 programs?:{program_id:number;program_name:string;company_name:string}[];defaultProgramId?:number;report?:Report;
}) {
 const router=useRouter();const {busy,error,message,run}=useAction();
 return <form className="space-y-4" onSubmit={async e=>{
  e.preventDefault();const values=formValues(e.currentTarget);
  if(report)await run(()=>api("PATCH",`/api/vulnerabilities/${report.vuln_id}`,values),{success:"Report updated"});
  else {const created=await run(()=>api<{vulnId:number}>("POST","/api/vulnerabilities",values));if(created)router.push(`/researcher/reports/${created.vulnId}`);}
 }}>
  {!report&&<div><label className="label" htmlFor="report-program">Program</label><select id="report-program" className="input" name="programId" defaultValue={defaultProgramId} required>
   {programs?.map(p=><option key={p.program_id} value={p.program_id}>{p.company_name} - {p.program_name}</option>)}
  </select></div>}
  <div><label className="label" htmlFor="report-title">Title</label><input id="report-title" className="input" name="title" defaultValue={report?.title} required minLength={5} maxLength={150}/></div>
  <div><label className="label" htmlFor="report-description">Description (impact and high-level reproduction; no live exploit code)</label>
   <textarea id="report-description" className="input min-h-40" name="description" defaultValue={report?.description??""} required minLength={20} maxLength={4000}/></div>
  <div className="grid gap-4 sm:grid-cols-2">
   <div><label className="label" htmlFor="report-severity">Severity</label><select id="report-severity" className="input" name="severity" defaultValue={report?.severity??"MEDIUM"}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></div>
   <div><label className="label" htmlFor="report-cvss">CVSS score (0.0 to 10.0)</label><input id="report-cvss" className="input" name="cvssScore" type="number" step="0.1" min="0" max="10" defaultValue={report?.cvss_score??""} required/></div>
  </div>
  <FormStatus error={error} message={message}/><button className="btn btn-primary" disabled={busy}>{report?"Save changes":"Submit report"}</button>
 </form>;
}
