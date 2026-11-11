import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge,StatusBadge } from "@/components/ui/Badge";
import { Timeline } from "@/components/ui/Timeline";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { SimilarPanel } from "@/components/forms/SimilarPanel";
import { requirePageUser } from "@/server/auth/guard";
import { getReportAdmin,listProgramReportOptions } from "@/server/services/vulnerabilities";
import { numberParam,orNotFound } from "@/server/pages";
import { money,shortDate } from "@/lib/format";
export default async function AdminReportDetail({params}:{params:Promise<{id:string}>}) {
 await requirePageUser("ADMIN");const id=numberParam((await params).id);
 const {report:r,history,chain}=await orNotFound(getReportAdmin(id));
 const candidates=await listProgramReportOptions(id);const status=String(r.status);
 return <>
  <PageHeader title={"#"+r.vuln_id+" "+r.title} subtitle={String(r.program_name)+" · "+String(r.company_name)+" · by "+String(r.researcher_name)+" · submitted "+shortDate(String(r.submitted_date))}
   actions={<><SeverityBadge value={String(r.severity)}/> <StatusBadge value={status}/></>}/>
  <div className="grid gap-6 xl:grid-cols-[1fr_380px]"><div className="space-y-6">
   <div className="card"><div className="card-title">Report</div><p className="whitespace-pre-wrap text-sm leading-relaxed">{String(r.description??"")}</p>
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
     <div><dt className="label">CVSS</dt><dd className="font-mono">{String(r.cvss_score??"-")}</dd></div>
     <div><dt className="label">Patch</dt><dd>{r.verification_status?<StatusBadge value={String(r.verification_status)}/>: "-"}</dd></div>
     <div><dt className="label">Payout</dt><dd>{r.payment_status?money(Number(r.amount??0),String(r.currency??"USD"))+" "+String(r.payment_status):"-"}</dd></div>
     <div><dt className="label">Canonical report</dt><dd className="font-mono">#{String(r.canonical_vuln_id)}</dd></div>
    </dl>
   </div>
   <div className="card"><div className="card-title">Duplicate chain (recursive CTE)</div>{chain.length<=1?<p className="text-sm text-muted">This report is not part of a duplicate chain.</p>:
    <ol className="space-y-1 text-sm">{chain.map(c=><li key={c.vuln_id} className="flex items-center gap-2" style={{paddingLeft:(c.depth-chain[0].depth)*16}}>
     <span className="font-mono text-xs text-muted">depth {c.depth}</span>{c.direction==="self"?<b>#{c.vuln_id} {c.title}</b>:<Link className="link" href={"/admin/reports/"+c.vuln_id}>#{c.vuln_id} {c.title}</Link>}<StatusBadge value={c.status}/>
    </li>)}</ol>}
   </div>
   <div className="card"><div className="card-title">Status history (written by triggers)</div><Timeline items={history}/></div>
  </div><div className="space-y-6">
   <div className="card"><div className="card-title">Review decision</div><ReviewForm vulnId={id} status={status} candidates={candidates}/></div>
   <div className="card"><div className="card-title">Semantic duplicate suggestions</div><SimilarPanel vulnId={id}/></div>
  </div></div>
 </>;
}
