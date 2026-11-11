import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { ProgramForm } from "@/components/forms/ProgramForm";
import { requirePageUser } from "@/server/auth/guard";
import { listProgramsAdmin } from "@/server/services/programs";
import { listCompanies } from "@/server/services/companies";
import { money } from "@/lib/format";
export default async function ProgramsPage() {
 await requirePageUser("ADMIN");
 const [programs,companies]=await Promise.all([listProgramsAdmin(),listCompanies()]);
 return <>
  <PageHeader title="Programs" subtitle="Payout totals are partitioned by currency; programs may therefore appear once per currency."/>
  <div className="card mb-6"><div className="card-title">Create a program</div><ProgramForm companies={companies.map(c=>({company_id:c.company_id,name:c.name}))}/></div>
  <div className="card overflow-x-auto p-0"><table className="table"><thead><tr>
   <th>Program</th><th>Company</th><th>Status</th><th className="text-right">Reports</th><th className="text-right">Open</th><th className="text-right">Accepted</th><th className="text-right">Duplicates</th><th>Completed payouts</th>
  </tr></thead><tbody>{programs.map(p=><tr key={`${p.program_id}-${p.currency??"none"}`}>
   <td><Link className="link font-medium" href={`/admin/programs/${p.program_id}`}>{p.program_name}</Link></td><td className="text-muted">{p.company_name}</td>
   <td><StatusBadge value={p.status}/></td><td className="text-right tabular-nums">{p.total_reports}</td>
   <td className="text-right tabular-nums">{Number(p.submitted)+Number(p.triaged)}</td><td className="text-right tabular-nums">{p.accepted}</td>
   <td className="text-right tabular-nums">{p.duplicates}</td><td className="tabular-nums">{p.currency?(`${p.currency} ${money(p.total_paid)}`):"—"}</td>
  </tr>)}</tbody></table></div>
 </>;
}
