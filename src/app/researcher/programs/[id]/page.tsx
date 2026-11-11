import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/server/auth/guard";
import { getPublicProgram } from "@/server/services/programs";
import { numberParam,orNotFound } from "@/server/pages";
export default async function ResearcherProgramDetail({params}:{params:Promise<{id:string}>}) {
 await requirePageUser("RESEARCHER");
 const p=await orNotFound(getPublicProgram(numberParam((await params).id)));
 return <>
  <PageHeader title={p.program_name} subtitle={`${p.company_name}${p.website?` · ${p.website}`:""}`}
   actions={<Link className="btn btn-primary" href={`/researcher/submit?program=${p.program_id}`}>Submit a report</Link>}/>
  <div className="card"><div className="card-title">Scope</div><p className="whitespace-pre-wrap text-sm leading-relaxed">{p.scope??"No scope published."}</p>
   <p className="mt-4 text-sm text-muted">{p.accepted_reports} report(s) accepted so far.</p></div>
 </>;
}
