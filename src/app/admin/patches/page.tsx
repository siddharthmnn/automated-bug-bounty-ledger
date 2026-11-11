import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge,StatusBadge } from "@/components/ui/Badge";
import { RecordPatchForm,VerifyPatchButtons } from "@/components/forms/LedgerActions";
import { requirePageUser } from "@/server/auth/guard";
import { listPatchQueue } from "@/server/services/ledger";
import { shortDate } from "@/lib/format";
export default async function PatchesPage() {
 await requirePageUser("ADMIN");const rows=await listPatchQueue();
 return <>
  <PageHeader title="Patches" subtitle="Only ACCEPTED reports can receive a patch; the database trigger enforces it."/>
  <div className="card overflow-x-auto p-0"><table className="table"><thead><tr><th>Report</th><th>Severity</th><th>Patch date</th><th>Verification</th><th>Verified by</th><th>Action</th></tr></thead>
   <tbody>{rows.map(p=><tr key={p.vuln_id}><td><Link className="link" href={"/admin/reports/"+p.vuln_id}>#{p.vuln_id} {p.title}</Link><div className="text-xs text-muted">{p.program_name} · {p.company_name}</div></td>
    <td><SeverityBadge value={p.severity}/></td><td className="text-muted">{shortDate(p.patch_date)}</td>
    <td>{p.verification_status?<StatusBadge value={p.verification_status}/>:<span className="text-muted">No patch</span>}</td>
    <td className="text-muted">{p.verified_by??"-"}</td><td className="min-w-64">{p.patch_id===null?<RecordPatchForm vulnId={p.vuln_id}/>:p.verification_status==="PENDING"?<VerifyPatchButtons patchId={p.patch_id}/>:null}</td>
   </tr>)}</tbody></table></div>
 </>;
}
