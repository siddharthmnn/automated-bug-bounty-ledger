"use client";
import { api, formValues } from "@/lib/api-client";
import { FormStatus, useAction } from "@/components/forms/useAction";
interface Company {company_id:number;name:string;industry:string|null;website:string|null;}
export function CompanyForm({company}:{company?:Company}) {
 const {busy,error,message,run}=useAction();
 return <form className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end" onSubmit={async e=>{
  e.preventDefault();const form=e.currentTarget;const values=formValues(form);
  if(company)await run(()=>api("PATCH",`/api/companies/${company.company_id}`,values),{success:"Saved"});
  else {const ok=await run(()=>api("POST","/api/companies",values),{success:"Company created"});if(ok)form.reset();}
 }}>
  <div><label className="label" htmlFor="company-name">Name</label><input id="company-name" className="input" name="name" defaultValue={company?.name} required minLength={2} maxLength={100}/></div>
  <div><label className="label" htmlFor="company-industry">Industry</label><input id="company-industry" className="input" name="industry" defaultValue={company?.industry??""} maxLength={50}/></div>
  <div><label className="label" htmlFor="company-website">Website</label><input id="company-website" className="input" name="website" defaultValue={company?.website??""} maxLength={100}/></div>
  <button className="btn btn-primary" disabled={busy}>{company?"Save":"Add company"}</button>
  <div className="sm:col-span-4"><FormStatus error={error} message={message}/></div>
 </form>;
}
