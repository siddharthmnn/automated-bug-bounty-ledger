import { PageHeader } from "@/components/ui/PageHeader";
import { ReportForm } from "@/components/forms/ReportForm";
import { requirePageUser } from "@/server/auth/guard";
import { listPublicPrograms } from "@/server/services/programs";
export default async function SubmitPage({searchParams}:{searchParams:Promise<{program?:string}>}) {
 await requirePageUser("RESEARCHER");
 const [{program},programs]=await Promise.all([searchParams,listPublicPrograms()]);
 return <>
  <PageHeader title="Submit a report" subtitle="The database procedure derives your researcher id from your authenticated session."/>
  <div className="card max-w-3xl">{programs.length?<ReportForm programs={programs} defaultProgramId={program?Number(program):undefined}/>:
   <p className="text-sm text-muted">There are no active bounty programs right now.</p>}</div>
 </>;
}
