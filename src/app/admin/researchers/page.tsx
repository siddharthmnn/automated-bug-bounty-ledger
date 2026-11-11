import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/server/auth/guard";
import { researcherDirectory } from "@/server/services/analytics";
import { money } from "@/lib/format";
export default async function ResearchersPage() {
 await requirePageUser("ADMIN");const rows=await researcherDirectory();
 return <>
  <PageHeader title="Researchers" subtitle="Admin directory joins RESEARCHER with the public leaderboard; contact details stay behind the admin database account."/>
  <div className="card overflow-x-auto p-0"><table className="table"><thead><tr><th>Researcher</th><th>E-mail</th><th>Country</th><th className="text-right">Reputation</th><th className="text-right">Reports</th><th className="text-right">Accepted</th><th className="text-right">Acceptance</th><th className="text-right">Earned</th></tr></thead>
   <tbody>{rows.map((r,i)=><tr key={Number(r.researcher_id)}><td className="font-medium">{String(r.name)}</td><td className="text-muted">{String(r.email)}</td><td className="text-muted">{String(r.country??"-")}</td>
    <td className="text-right tabular-nums">{String(r.reputation_score)}</td><td className="text-right tabular-nums">{String(r.reports_submitted)}</td><td className="text-right tabular-nums">{String(r.accepted_reports)}</td>
    <td className="text-right tabular-nums">{r.acceptance_pct===null?"-":String(r.acceptance_pct)+"%"}</td><td className="text-right tabular-nums">{money(Number(r.total_earned))}</td></tr>)}</tbody>
  </table></div>
 </>;
}
