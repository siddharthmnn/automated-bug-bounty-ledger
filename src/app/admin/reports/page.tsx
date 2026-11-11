import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge,StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requirePageUser } from "@/server/auth/guard";
import { listReportsAdmin } from "@/server/services/vulnerabilities";
import { listProgramsAdmin } from "@/server/services/programs";
import { reportFilterSchema } from "@/server/validation/schemas";
import { shortDate } from "@/lib/format";
const STATUSES=["SUBMITTED","TRIAGED","ACCEPTED","REJECTED","DUPLICATE"];
const SEVERITIES=["CRITICAL","HIGH","MEDIUM","LOW"];
export default async function ReportsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
 await requirePageUser("ADMIN");const raw=await searchParams;
 const parsed=reportFilterSchema.safeParse(Object.fromEntries(Object.entries(raw).filter(([,v])=>v)));
 const filters=parsed.success?parsed.data:{};
 const [reports,programs]=await Promise.all([listReportsAdmin(filters),listProgramsAdmin()]);
 return <>
  <PageHeader title="Reports" subtitle="Triage queue. Keyword search uses the MySQL FULLTEXT index on title and description."/>
  <form className="card mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
   <input className="input lg:col-span-2" name="q" placeholder="Keyword search, e.g. token reuse" defaultValue={raw.q??""}/>
   <select className="input" name="status" defaultValue={raw.status??""}><option value="">Any status</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
   <select className="input" name="severity" defaultValue={raw.severity??""}><option value="">Any severity</option>{SEVERITIES.map(s=><option key={s}>{s}</option>)}</select>
   <select className="input" name="programId" defaultValue={raw.programId??""}><option value="">Any program</option>{programs.map(p=><option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}</select>
   <div className="flex gap-2 lg:col-span-5"><button className="btn btn-primary btn-sm">Apply</button><Link className="btn btn-sm" href="/admin/reports">Reset</Link></div>
  </form>
  {reports.length===0?<EmptyState title="No reports match these filters"/>:
   <div className="card overflow-x-auto p-0"><table className="table"><thead><tr><th>Report</th><th>Program</th><th>Researcher</th><th>Severity</th><th>Status</th><th>Patch</th><th>Payout</th><th>Submitted</th>{filters.q&&<th className="text-right">Relevance</th>}</tr></thead>
   <tbody>{reports.map(r=><tr key={r.vuln_id}><td><Link className="link" href={`/admin/reports/${r.vuln_id}`}>#{r.vuln_id} {r.title}</Link>{r.duplicate_of_vuln_id&&<div className="text-xs text-muted">duplicate of #{r.duplicate_of_vuln_id}</div>}</td>
   <td className="text-muted">{r.program_name}<div className="text-xs">{r.company_name}</div></td><td className="text-muted">{r.researcher_name}</td>
   <td><SeverityBadge value={r.severity}/></td><td><StatusBadge value={r.status}/></td>
   <td>{r.verification_status?<StatusBadge value={r.verification_status}/>:<span className="text-muted">-</span>}</td>
   <td>{r.payment_status?<StatusBadge value={r.payment_status}/>:<span className="text-muted">-</span>}</td>
   <td className="text-muted">{shortDate(r.submitted_date)}</td>{filters.q&&<td className="text-right font-mono text-xs">{Number(r.relevance??0).toFixed(3)}</td>}
   </tr>)}</tbody></table></div>}
 </>;
}
