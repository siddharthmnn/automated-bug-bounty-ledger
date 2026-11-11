import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge,StatusBadge } from "@/components/ui/Badge";
import { Timeline } from "@/components/ui/Timeline";
import { ReportForm } from "@/components/forms/ReportForm";
import { DeleteButton } from "@/components/forms/DeleteButton";
import { requirePageUser } from "@/server/auth/guard";
import { getMyReport } from "@/server/services/vulnerabilities";
import { numberParam,orNotFound } from "@/server/pages";
import { money,shortDate } from "@/lib/format";
export default async function MyReportDetail({params}:{params:Promise<{id:string}>}) {
 const user=await requirePageUser("RESEARCHER"),id=numberParam((await params).id);
 const {report:r,history}=await orNotFound(getMyReport(user,id));const editable=r.status==="SUBMITTED";
 return <>
  <PageHeader title={`#${r.vuln_id} ${r.title}`} subtitle={`${r.program_name} · ${r.company_name} · submitted ${shortDate(String(r.submitted_date))}`}
   actions={<><SeverityBadge value={String(r.severity)}/> <StatusBadge value={String(r.status)}/></>}/>
  <div className="grid gap-6 xl:grid-cols-[1fr_360px]"><div className="card">
   {editable?<><div className="card-title">Edit while it is still SUBMITTED</div><ReportForm report={{vuln_id:id,title:String(r.title),description:r.description===null?null:String(r.description),severity:String(r.severity),cvss_score:r.cvss_score===null?null:Number(r.cvss_score)}}/></>:
   <><div className="card-title">Report</div><p className="whitespace-pre-wrap text-sm leading-relaxed">{String(r.description??"")}</p>
    {r.duplicate_of_vuln_id&&<p className="mt-3 text-sm text-muted">Marked as a duplicate of report #{String(r.duplicate_of_vuln_id)}.</p>}</>}
  </div><div className="space-y-6">
   <div className="card text-sm"><div className="card-title">Ledger</div><dl className="space-y-2">
    <div className="flex justify-between"><dt className="text-muted">CVSS</dt><dd className="font-mono">{String(r.cvss_score??"-")}</dd></div>
    <div className="flex justify-between"><dt className="text-muted">Patch</dt><dd>{r.patch_status?<StatusBadge value={String(r.patch_status)}/>: "-"}</dd></div>
    <div className="flex justify-between"><dt className="text-muted">Payout</dt><dd>{r.payment_status?`${money(Number(r.payout_amount),String(r.payout_currency??"USD"))} · ${r.payment_status}`:"-"}</dd></div>
   </dl></div>
   <div className="card"><div className="card-title">History</div><Timeline items={history}/></div>
   {editable&&<div className="card"><div className="card-title">Withdraw</div><p className="mb-3 text-sm text-muted">Only possible before triage; ownership and status are checked inside the stored procedure.</p>
    <DeleteButton url={`/api/vulnerabilities/${id}`} label="Withdraw report" redirectTo="/researcher/reports"/></div>}
  </div></div>
 </>;
}
