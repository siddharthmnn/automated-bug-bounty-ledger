import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/server/auth/guard";
import { leaderboard } from "@/server/services/analytics";
import { money } from "@/lib/format";
export default async function LeaderboardPage() {
 const user=await requirePageUser(),rows=await leaderboard(user.role);
 return <AppShell user={user}><PageHeader title="Leaderboard" subtitle="Ranked from the CTE + RANK() view. No e-mail addresses or private profile fields are exposed."/>
  <div className="card overflow-x-auto p-0"><table className="table"><thead><tr><th>Rank</th><th>Researcher</th><th>Country</th><th className="text-right">Reputation</th><th className="text-right">Reports</th><th className="text-right">Accepted</th><th className="text-right">Earned</th></tr></thead>
   <tbody>{rows.map(r=><tr key={r.researcher_id} className={r.researcher_id===user.researcherId?"bg-accent/10":undefined}>
    <td className="font-mono">#{r.earnings_rank}</td><td className="font-medium">{r.name}</td><td className="text-muted">{r.country??"-"}</td>
    <td className="text-right tabular-nums">{r.reputation_score}</td><td className="text-right tabular-nums">{r.reports_submitted}</td><td className="text-right tabular-nums">{r.accepted_reports}</td><td className="text-right tabular-nums">{money(r.total_earned)}</td>
   </tr>)}</tbody></table></div>
 </AppShell>;
}
