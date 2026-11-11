import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/server/auth/guard";
import { adminDashboard } from "@/server/services/analytics";
import { money,shortDate } from "@/lib/format";
function Metric({label,value,href}:{label:string;value:unknown;href?:string}) {
 const body=<><div className="label">{label}</div><div className="text-2xl font-semibold tabular-nums">{String(value??0)}</div></>;
 return href?<Link href={href} className="card block transition hover:border-accent/60">{body}</Link>:<div className="card">{body}</div>;
}
export default async function AdminHome() {
 const user=await requirePageUser("ADMIN"),data=await adminDashboard(),c=data.counts as Record<string,unknown>;
 return <>
  <PageHeader title="Security operations" subtitle={`Signed in as ${user.displayName}. Live workflow metrics from MySQL.`}
   actions={<><Link className="btn btn-sm" href="/admin/reports">Triage reports</Link><Link className="btn btn-sm" href="/admin/analytics">SQL analytics</Link></>}/>
  <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
   <Metric label="Total reports" value={c.reports} href="/admin/reports"/>
   <Metric label="Submitted · awaiting triage" value={c.submitted}/>
   <Metric label="Accepted reports" value={c.accepted}/>
   <Metric label="Pending payouts" value={c.pending_payouts} href="/admin/payouts"/>
   <Metric label="Active programs" value={c.active_programs} href="/admin/programs"/>
   <Metric label="Companies" value={c.companies} href="/admin/companies"/>
   <Metric label="Verified patches" value={c.verified_patches} href="/admin/patches"/>
   <Metric label="Triaged reports" value={c.triaged}/>
  </section>
  <div className="grid gap-5 xl:grid-cols-2">
   <section className="card"><h2 className="card-title">Report pipeline</h2>
    <div className="space-y-3">{data.byStatus.map((x,i)=>{const row=x as Record<string,unknown>;const n=Number(row.total??0),max=Math.max(1,...data.byStatus.map(y=>Number((y as Record<string,unknown>).total??0)));return <div key={String(row.status)}><div className="mb-1 flex justify-between text-sm"><span>{String(row.status)}</span><span className="font-mono">{n}</span></div><div className="h-2 rounded-full bg-bg"><div className="h-2 rounded-full bg-accent" style={{width:`${100*n/max}%`}}/></div></div>;})}</div>
   </section>
   <section className="card"><h2 className="card-title">Completed payouts · grouped by currency</h2>
    {data.payouts.length?<div className="space-y-3">{data.payouts.map(x=>{const row=x as Record<string,unknown>;return <div key={String(row.currency)} className="flex items-center justify-between border-b border-line/60 pb-2"><span>{String(row.currency)} <span className="text-xs text-muted">· {String(row.payouts)} payout(s)</span></span><strong className="tabular-nums">{money(Number(row.completed_total??0),String(row.currency))}</strong></div>;})}</div>:<p className="text-sm text-muted">No payouts recorded yet.</p>}
   </section>
  </div>
  <section className="card mt-5"><div className="mb-3 flex items-center justify-between"><h2 className="card-title mb-0">Recently submitted reports</h2><Link className="link text-sm" href="/admin/reports">View queue</Link></div>
   {data.recent.length?<div className="overflow-x-auto"><table className="table"><thead><tr><th>Report</th><th>Researcher</th><th>Severity</th><th>Status</th><th>Submitted</th></tr></thead><tbody>{data.recent.map(x=>{const r=x as Record<string,unknown>;return <tr key={String(r.vuln_id)}><td><Link className="link" href={`/admin/reports/${r.vuln_id}`}>#{String(r.vuln_id)} {String(r.title)}</Link></td><td>{String(r.researcher_name)}</td><td>{String(r.severity)}</td><td>{String(r.status)}</td><td>{shortDate(String(r.submitted_date??""))}</td></tr>;})}</tbody></table></div>:<p className="text-sm text-muted">No reports submitted yet.</p>}
  </section>
 </>;
}
