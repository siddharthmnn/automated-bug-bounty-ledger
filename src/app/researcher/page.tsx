import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/server/auth/guard";
import { listMyReports } from "@/server/services/vulnerabilities";
import { listMyPayouts } from "@/server/services/ledger";
import { money,shortDate } from "@/lib/format";
export default async function ResearcherHome() {
 const user=await requirePageUser("RESEARCHER");
 const [reports,payouts]=await Promise.all([listMyReports(user),listMyPayouts(user)]);
 const accepted=reports.filter(r=>r.status==="ACCEPTED").length;
 const pending=reports.filter(r=>["SUBMITTED","TRIAGED"].includes(r.status)).length;
 const paid=payouts.filter(p=>p.payment_status==="COMPLETED").reduce((acc,p)=>{acc[p.currency]=(acc[p.currency]??0)+Number(p.amount);return acc;},{} as Record<string,number>);
 const recent=[...reports].sort((a,b)=>String(b.submitted_date).localeCompare(String(a.submitted_date))).slice(0,6);
 return <>
  <PageHeader title={`Welcome, ${user.displayName}`} subtitle="Your submissions, review progress and payouts in one place."
   actions={<Link className="btn btn-primary btn-sm" href="/researcher/submit">Submit a report</Link>}/>
  <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
   <div className="card"><div className="label">Reports submitted</div><div className="text-2xl font-semibold">{reports.length}</div></div>
   <div className="card"><div className="label">Awaiting review</div><div className="text-2xl font-semibold">{pending}</div></div>
   <div className="card"><div className="label">Accepted reports</div><div className="text-2xl font-semibold">{accepted}</div></div>
   <div className="card"><div className="label">Payout records</div><div className="text-2xl font-semibold">{payouts.length}</div></div>
  </section>
  <section className="card mb-5"><h2 className="card-title">Completed earnings · grouped by currency</h2>
   {Object.keys(paid).length?<div className="flex flex-wrap gap-3">{Object.entries(paid).map(([currency,amount])=><div key={currency} className="rounded-lg border border-line bg-bg px-4 py-3"><div className="label">{currency}</div><div className="text-xl font-semibold tabular-nums">{money(amount,currency)}</div></div>)}</div>:<p className="text-sm text-muted">No completed payouts yet. Accepted reports may still be moving through patch verification and payout.</p>}
  </section>
  <section className="card"><div className="mb-3 flex items-center justify-between"><h2 className="card-title mb-0">Recent reports</h2><Link className="link text-sm" href="/researcher/reports">All reports</Link></div>
   {recent.length?<div className="overflow-x-auto"><table className="table"><thead><tr><th>Report</th><th>Program</th><th>Severity</th><th>Status</th><th>Submitted</th></tr></thead><tbody>{recent.map(r=><tr key={r.vuln_id}><td><Link className="link" href={`/researcher/reports/${r.vuln_id}`}>#{r.vuln_id} {r.title}</Link></td><td>{r.program_name}</td><td>{r.severity}</td><td>{r.status}</td><td>{shortDate(r.submitted_date)}</td></tr>)}</tbody></table></div>:<p className="text-sm text-muted">No reports yet. <Link className="link" href="/researcher/programs">Browse active programs</Link> and submit your first finding.</p>}
  </section>
 </>;
}
