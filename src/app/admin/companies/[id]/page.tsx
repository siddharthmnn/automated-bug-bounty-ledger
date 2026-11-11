import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { CompanyForm } from "@/components/forms/CompanyForm";
import { ProgramForm } from "@/components/forms/ProgramForm";
import { DeleteButton } from "@/components/forms/DeleteButton";
import { requirePageUser } from "@/server/auth/guard";
import { getCompany } from "@/server/services/companies";
import { listProgramsAdmin } from "@/server/services/programs";
import { numberParam,orNotFound } from "@/server/pages";
import { money } from "@/lib/format";
export default async function CompanyDetail({params}:{params:Promise<{id:string}>}) {
 await requirePageUser("ADMIN");const id=numberParam((await params).id);
 const company=await orNotFound(getCompany(id));const programs=await listProgramsAdmin(id);
 return <>
  <PageHeader title={company.name} subtitle={`${company.industry??"No industry"} · ${company.website??"no website"}`}/>
  <div className="card mb-6"><div className="card-title">Edit company</div><CompanyForm company={company}/></div>
  <div className="card mb-6"><div className="card-title">Add a program</div><ProgramForm companies={[{company_id:company.company_id,name:company.name}]} companyId={company.company_id}/></div>
  <div className="card mb-6 overflow-x-auto p-0"><table className="table"><thead><tr><th>Program</th><th>Status</th><th className="text-right">Reports</th><th className="text-right">Accepted</th><th className="text-right">Paid</th></tr></thead>
   <tbody>{programs.map(p=><tr key={p.program_id}><td><Link className="link" href={`/admin/programs/${p.program_id}`}>{p.program_name}</Link></td>
    <td><StatusBadge value={p.status}/></td><td className="text-right tabular-nums">{p.total_reports}</td><td className="text-right tabular-nums">{p.accepted}</td><td className="text-right tabular-nums">{money(p.total_paid)}</td></tr>)}</tbody>
  </table></div>
  <div className="card"><div className="card-title">Danger zone</div>
   <p className="mb-3 text-sm text-muted">Deleting cascades to programs and their SUBMITTED reports. The database trigger blocks deletion once any report has been reviewed; close programs instead.</p>
   <DeleteButton url={`/api/companies/${company.company_id}`} label="Delete company" redirectTo="/admin/companies"/>
  </div>
 </>;
}
