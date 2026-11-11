import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { SeverityBadge,StatusBadge } from "@/components/ui/Badge";
import { ProgramForm } from "@/components/forms/ProgramForm";
import { DeleteButton } from "@/components/forms/DeleteButton";
import { requirePageUser } from "@/server/auth/guard";
import { getProgramAdmin } from "@/server/services/programs";
import { listReportsAdmin } from "@/server/services/vulnerabilities";
import { numberParam,orNotFound } from "@/server/pages";
import { shortDate } from "@/lib/format";
export default async function ProgramDetail({params}:{params:Promise<{id:string}>}) {
 await requirePageUser("ADMIN");const id=numberParam((await params).id);
 const {program,stats}=await orNotFound(getProgramAdmin(id));const reports=await listReportsAdmin({programId:id});
 const totals=stats[0];
 const payoutSummary=stats.filter(s=>s.currency!==null).map(s=>s.currency+" "+Number(s.total_paid).toFixed(2)).join(" · ")||"—";
 return <>
  <PageHeader title={program.name} subtitle={program.company_name+" · program #"+program.program_id} actions={<StatusBadge value={program.status}/>}/>
  <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   <StatCard label="Reports" value={totals?.total_reports??0}/>
   <StatCard label="Open" value={Number(totals?.submitted??0)+Number(totals?.triaged??0)}/>
   <StatCard label="Accepted" value={totals?.accepted??0} hint={(totals?.critical_reports??0)+" critical overall"}/>
   <StatCard label="Completed payouts by currency" value={payoutSummary}/>
  </div>
  <div className="card mb-6"><div className="card-title">Edit program</div><ProgramForm program={program}/></div>
  <div className="card mb-6 overflow-x-auto p-0"><table className="table"><thead><tr><th>Report</th><th>Researcher</th><th>Severity</th><th>Status</th><th>Submitted</th></tr></thead>
   <tbody>{reports.map(r=><tr key={r.vuln_id}><td><Link className="link" href={"/admin/reports/"+r.vuln_id}>#{r.vuln_id} {r.title}</Link></td>
    <td className="text-muted">{r.researcher_name}</td><td><SeverityBadge value={r.severity}/></td><td><StatusBadge value={r.status}/></td><td className="text-muted">{shortDate(r.submitted_date)}</td></tr>)}</tbody>
  </table></div>
  <div className="card"><div className="card-title">Danger zone</div><p className="mb-3 text-sm text-muted">Reviewed reports are retained for the patch and payout ledger. Close this program instead of deleting it.</p>
   <DeleteButton url={"/api/programs/"+program.program_id} label="Delete program" redirectTo="/admin/programs"/>
  </div>
 </>;
}
