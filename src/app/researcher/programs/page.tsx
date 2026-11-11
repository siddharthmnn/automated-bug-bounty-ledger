import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { requirePageUser } from "@/server/auth/guard";
import { listPublicPrograms } from "@/server/services/programs";
export default async function ResearcherPrograms() {
 await requirePageUser("RESEARCHER");const programs=await listPublicPrograms();
 return <>
  <PageHeader title="Programs" subtitle="Only ACTIVE programs are visible. Paused and closed programs do not accept reports."/>
  {programs.length===0?<EmptyState title="No active programs are available">Check back later, or return to your <Link className="link" href="/researcher">dashboard</Link>.</EmptyState>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{programs.map(p=><div key={p.program_id} className="card flex min-w-0 flex-col">
   <div className="text-xs text-muted">{p.company_name}{p.industry?` · ${p.industry}`:""}</div>
   <Link className="link mt-1 text-lg font-semibold" href={`/researcher/programs/${p.program_id}`}>{p.program_name}</Link>
   <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{p.scope??"No scope published."}</p>
   <div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted">{p.accepted_reports} accepted report(s)</span><Link className="btn btn-sm btn-primary" href={`/researcher/submit?program=${p.program_id}`}>Report</Link></div>
  </div>)}</div>}
 </>;
}
