import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge,StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requirePageUser } from "@/server/auth/guard";
import { listMyReports } from "@/server/services/vulnerabilities";
import { money,shortDate } from "@/lib/format";
export default async function MyReports() {
 const user=await requirePageUser("RESEARCHER");const reports=await listMyReports(user);
 return <>
  <PageHeader title="My reports" subtitle="The stored procedure returns only reports owned by your login."
   actions={<Link className="btn btn-primary" href="/researcher/submit">New report</Link>}/>
  {reports.length===0?<EmptyState title="You have not submitted a report yet"><Link className="link" href="/researcher/programs">Browse programs</Link></EmptyState>:
  <div className="card overflow-x-auto p-0"><table className="table"><thead><tr><th>Report</th><th>Program</th><th>Severity</th><th>Status</th><th>Payout</th><th>Submitted</th></tr></thead>
   <tbody>{reports.map(r=><tr key={r.vuln_id}><td><Link className="link" href={`/researcher/reports/${r.vuln_id}`}>#{r.vuln_id} {r.title}</Link>
   {r.duplicate_of_vuln_id&&<div className="text-xs text-muted">duplicate of #{r.duplicate_of_vuln_id}</div>}</td>
   <td className="text-muted">{r.program_name}<div className="text-xs">{r.company_name}</div></td><td><SeverityBadge value={r.severity}/></td><td><StatusBadge value={r.status}/></td>
   <td>{r.payment_status?`${money(r.payout_amount,r.payout_currency??"USD")} · ${r.payment_status}`:<span className="text-muted">-</span>}</td>
   <td className="text-muted">{shortDate(r.submitted_date)}</td></tr>)}</tbody></table></div>}
 </>;
}
