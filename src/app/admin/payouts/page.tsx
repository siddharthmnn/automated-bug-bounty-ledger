import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge,StatusBadge } from "@/components/ui/Badge";
import { CompletePayoutButtons,CreatePayoutForm } from "@/components/forms/LedgerActions";
import { requirePageUser } from "@/server/auth/guard";
import { listPayoutQueue } from "@/server/services/ledger";
import { money,shortDate } from "@/lib/format";
export default async function PayoutsPage() {
 await requirePageUser("ADMIN");const rows=await listPayoutQueue();
 return <>
  <PageHeader title="Payouts" subtitle="The ledger. sp_complete_payout locks each payout row so processing can happen only once."/>
  <div className="card overflow-x-auto p-0"><table className="table"><thead><tr><th>Report</th><th>Researcher</th><th>Severity</th><th>Patch</th><th className="text-right">Amount</th><th>Status</th><th>Paid on</th><th>Action</th></tr></thead>
   <tbody>{rows.map(p=><tr key={p.vuln_id}><td><Link className="link" href={"/admin/reports/"+p.vuln_id}>#{p.vuln_id} {p.title}</Link><div className="text-xs text-muted">{p.company_name}</div></td>
    <td className="text-muted">{p.researcher_name}</td><td><SeverityBadge value={p.severity}/>{p.suggested_severity&&p.suggested_severity!==p.severity?<div className="text-xs text-warn">CVSS suggests {p.suggested_severity}</div>:null}</td>
    <td>{p.verification_status?<StatusBadge value={p.verification_status}/>:<span className="text-muted">-</span>}</td>
    <td className="text-right tabular-nums">{p.amount===null?"-":money(p.amount,p.currency??"USD")}</td><td>{p.payment_status?<StatusBadge value={p.payment_status}/>:<span className="text-muted">Not created</span>}</td>
    <td className="text-muted">{shortDate(p.payment_date)}</td><td className="min-w-64">{p.payout_id===null?<CreatePayoutForm vulnId={p.vuln_id}/>:p.payment_status==="PENDING"?<CompletePayoutButtons payoutId={p.payout_id}/>:null}</td>
   </tr>)}</tbody></table></div>
 </>;
}
