"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/Badge";
interface Hit {vuln_id:number;title:string;status:string;program_name:string;score?:number;relevance?:number;}
export function SearchCompare() {
 const [q,setQ]=useState("");const [busy,setBusy]=useState(false);
 const [keyword,setKeyword]=useState<Hit[]|string|null>(null),[semantic,setSemantic]=useState<Hit[]|string|null>(null);
 async function search(e:React.FormEvent) {
  e.preventDefault();setBusy(true);const enc=encodeURIComponent(q);
  const [k,s]=await Promise.allSettled([
   api<Hit[]>("GET","/api/search?mode=keyword&q="+enc),
   api<Hit[]>("GET","/api/search?mode=semantic&q="+enc)
  ]);
  setKeyword(k.status==="fulfilled"?k.value:(k.reason as Error).message);
  setSemantic(s.status==="fulfilled"?s.value:(s.reason as Error).message);setBusy(false);
 }
 const column=(title:string,hint:string,data:Hit[]|string|null,key:"relevance"|"score")=><div className="card">
  <div className="card-title">{title}</div><p className="mb-3 text-xs text-muted">{hint}</p>
  {data===null&&<p className="text-sm text-muted">Run a search.</p>}
  {typeof data==="string"&&<p className="text-sm text-bad">{data}</p>}
  {Array.isArray(data)&&!data.length&&<p className="text-sm text-muted">No matches.</p>}
  {Array.isArray(data)&&<ul className="space-y-2">{data.slice(0,10).map(h=><li key={h.vuln_id} className="flex items-start justify-between gap-3 border-b border-line/60 pb-2">
   <div><Link className="link text-sm" href={"/admin/reports/"+h.vuln_id}># {h.vuln_id} {h.title}</Link><div className="mt-1 flex items-center gap-2 text-xs text-muted"><StatusBadge value={h.status}/>{h.program_name}</div></div>
   <span className="font-mono text-xs tabular-nums text-muted">{Number(h[key]??0).toFixed(3)}</span>
  </li>)}</ul>}
 </div>;
 return <div className="space-y-4"><form onSubmit={search} className="flex gap-2">
  <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Try: someone else can see my medical results" minLength={3} maxLength={200} required/>
  <button className="btn btn-primary" disabled={busy}>{busy?"Searching...":"Search"}</button>
 </form><div className="grid gap-4 lg:grid-cols-2">
 {column("Keyword: MySQL FULLTEXT","MATCH(title, description) AGAINST(...) finds shared words.",keyword,"relevance")}
 {column("Semantic: Qdrant vectors","Cosine similarity of local embeddings finds shared meaning.",semantic,"score")}
 </div></div>;
}
