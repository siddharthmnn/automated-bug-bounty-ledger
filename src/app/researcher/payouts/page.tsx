import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge,StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requirePageUser } from "@/server/auth/guard";
import { listMyPayouts } from "@/server/services/ledger";
import { money,shortDate } from "@/lib/format";
export default async function MyPayouts() {
 const user=await requirePageUser("RESEARCHER");const rows=await listMyPayouts(user);
 const totals=rows.filter(r=>r.payment_status==="COMPLETED").reduce((m,r)=>{m[r.currency]=(m[r.currency]??0)+Number(r.amount);return m;},{} as Record<string,number>);
 return <>
  <PageHeader title="My payouts" subtitle="The stored procedure scopes these rows to your authenticated researcher profile. Completed totals stay separate by currency."/>
  <div className="mb-5 flex flex-wrap gap-3">{Object.entries(totals).map(([currency,amount])=><div key={currency} className="card min-w-40"><div className="label">Completed · {currency}</div><div className="text-xl font-semibold tabular-nums">{money(amount,currency)}</div></div>)}</div>
  {rows.length===0?<EmptyState title="No payouts yet"/>:<div className="card overflow-x-auto p-0"><table className="table"><thead><tr><th>Report</th><th>Severity</th><th className="text-right">Amount</th><th>Status</th><th>Paid on</th></tr></thead>
   <tbody>{rows.map(p=><tr key={p.payout_id}><td><Link className="link" href={"/researcher/reports/"+p.vuln_id}>#{p.vuln_id} {p.title}</Link><div className="text-xs text-muted">{p.program_name} · {p.company_name}</div></td>
    <td><SeverityBadge value={p.severity}/></td><td className="text-right tabular-nums">{money(p.amount,p.currency)}</td><td><StatusBadge value={p.payment_status}/></td><td className="text-muted">{shortDate(p.payment_date)}</td></tr>)}</tbody></table></div>}
 </>;
}
