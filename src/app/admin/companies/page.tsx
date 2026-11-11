import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { CompanyForm } from "@/components/forms/CompanyForm";
import { requirePageUser } from "@/server/auth/guard";
import { listCompanies } from "@/server/services/companies";
import { money } from "@/lib/format";
export default async function CompaniesPage() {
 await requirePageUser("ADMIN");const companies=await listCompanies();
 return <>
  <PageHeader title="Companies" subtitle="Organisations that run bounty programs (COMPANY 1:M PROGRAM)."/>
  <div className="card mb-6"><div className="card-title">Add a company</div><CompanyForm/></div>
  <div className="card overflow-x-auto p-0"><table className="table"><thead><tr>
   <th>Company</th><th>Industry</th><th>Website</th><th className="text-right">Programs</th><th className="text-right">Active</th><th className="text-right">Paid out</th>
  </tr></thead><tbody>{companies.map(c=><tr key={c.company_id}>
   <td><Link className="link font-medium" href={`/admin/companies/${c.company_id}`}>{c.name}</Link></td>
   <td className="text-muted">{c.industry??"-"}</td><td className="text-muted">{c.website??"-"}</td>
   <td className="text-right tabular-nums">{c.programs}</td><td className="text-right tabular-nums">{c.active_programs}</td>
   <td className="text-right tabular-nums">{money(c.total_paid)}</td></tr>)}</tbody></table></div>
 </>;
}
