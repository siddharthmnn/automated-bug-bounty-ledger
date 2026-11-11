import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/server/auth/guard";
import { runAllCatalogueQueries } from "@/server/services/analytics";
function cell(v:unknown){return v===null||v===undefined?"NULL":String(v);}
export default async function AnalyticsPage() {
 await requirePageUser("ADMIN");const results=await runAllCatalogueQueries();
 return <>
  <PageHeader title="SQL analytics" subtitle="Twelve live MySQL queries: joins, anti-joins, correlated and nested subqueries, CTEs, window functions and recursive traversal."/>
  <nav className="card mb-6 flex flex-wrap gap-2 text-sm">{results.map(q=><a key={q.id} className="btn btn-sm" href={"#"+q.id}>{q.id}</a>)}</nav>
  <div className="space-y-6">{results.map(q=>{
   const columns=q.rows.length?Object.keys(q.rows[0]):[];
   return <section key={q.id} id={q.id} className="card scroll-mt-6">
    <div className="mb-1 flex flex-wrap items-baseline gap-3"><span className="font-mono text-sm text-accent">{q.id}</span><h2 className="font-semibold">{q.title}</h2></div>
    <p className="mb-3 text-xs text-muted">{q.technique}</p><details className="mb-3"><summary className="cursor-pointer text-sm text-muted">Show SQL</summary><pre className="code mt-2 overflow-x-auto whitespace-pre text-xs">{q.sql}</pre></details>
    <div className="overflow-x-auto"><table className="table"><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead>
     <tbody>{q.rows.slice(0,15).map((row,i)=><tr key={i}>{columns.map(c=><td key={c} className="max-w-64 truncate text-xs">{cell(row[c])}</td>)}</tr>)}</tbody>
    </table>{q.rows.length>15&&<p className="mt-2 text-xs text-muted">Showing 15 of {q.rows.length} rows.</p>}</div>
   </section>;
  })}</div>
 </>;
}
