import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { VectorSyncActions } from "@/components/forms/VectorSyncActions";
import { requirePageUser } from "@/server/auth/guard";
import { vectorSyncStatus } from "@/server/services/system";
import { shortDate } from "@/lib/format";
export default async function VectorSyncPage() {
 await requirePageUser("ADMIN");const s=await vectorSyncStatus();
 const count=(state:string)=>s.byState.find(x=>x.state===state)?.jobs??0;
 return <>
  <PageHeader title="Vector sync" subtitle={"Transactional outbox worker embeds with "+s.model+" and syncs to Qdrant collection "+s.collection+"."}/>
  <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   <StatCard label="Reports in MySQL" value={s.reports}/><StatCard label="Points in Qdrant" value={s.points??"unreachable"} hint={s.qdrantError??undefined}/>
   <StatCard label="Pending jobs" value={count("PENDING")}/><StatCard label="Failed jobs" value={count("FAILED")} hint="After five attempts"/>
  </div>
  <div className="card mb-6"><div className="card-title">Actions</div><VectorSyncActions/></div>
  <div className="card overflow-x-auto p-0"><table className="table"><thead><tr><th>Job</th><th>Report</th><th>Operation</th><th>State</th><th className="text-right">Attempts</th><th>Created</th><th>Processed</th><th>Last error</th></tr></thead>
   <tbody>{s.recent.map(j=><tr key={j.job_id}><td className="font-mono text-xs">{j.job_id}</td><td className="font-mono text-xs">#{j.vuln_id}</td><td className="font-mono text-xs">{j.operation}</td>
    <td><StatusBadge value={j.state}/></td><td className="text-right tabular-nums">{j.attempts}</td><td className="text-muted">{shortDate(j.created_at)}</td>
    <td className="text-muted">{j.processed_at?shortDate(j.processed_at):"-"}</td><td className="max-w-80 truncate text-xs text-bad" title={j.last_error??""}>{j.last_error??""}</td>
   </tr>)}</tbody></table></div>
 </>;
}
