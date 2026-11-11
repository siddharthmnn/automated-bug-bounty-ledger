import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/server/auth/guard";
import { researcherDirectory } from "@/server/services/analytics";
import { money } from "@/lib/format";
export default async function ResearchersPage() {
 await requirePageUser("ADMIN");const rows=await researcherDirectory();
 return <>
  <PageHeader title="Researchers" subtitle="Admin directory joins RESEARCHER with the public leaderboard; earnings are shown separately by currency."/>
  <div className="card overflow-x-auto p-0"><table className="table"><thead><tr><th>Researcher</th><th>E-mail</th><th>Country</th><th>Reputation</th><th>Reports</th><th>Accepted</th><th>Acceptance</th><th>Currency</th><th>Earned</th></tr></thead>
   <tbody>{rows.map(r=><tr key={String(r.researcher_id)+String(r.currency)}><td className="font-medium">{String(r.name)}</td><td className="text-muted">{String(r.email)}</td><td className="text-muted">{String(r.country??"-")}</td>
    <td className="tabular-nums">{String(r.reputation_score)}</td><td className="tabular-nums">{String(r.reports_submitted??0)}</td><td className="tabular-nums">{String(r.accepted_reports??0)}</td>
    <td className="tabular-nums">{r.acceptance_pct===null||r.acceptance_pct===undefined?"-":String(r.acceptance_pct)+"%"}</td><td>{String(r.currency??"-")}</td><td className="tabular-nums">{r.currency?money(Number(r.total_earned),String(r.currency)):"-"}</td></tr>)}</tbody>
  </table></div>
 </>;
}
