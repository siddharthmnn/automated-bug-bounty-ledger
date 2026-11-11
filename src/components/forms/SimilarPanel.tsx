"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { api } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/Badge";
interface Similar {vuln_id:number;score:number;likely_duplicate:boolean;title:string;status:string;program_name:string;researcher_name:string;}
type State={kind:"loading"}|{kind:"error";message:string}|{kind:"ok";indexed:boolean;threshold:number;results:Similar[]};
export function SimilarPanel({vulnId}:{vulnId:number}) {
 const [state,setState]=useState<State>({kind:"loading"});
 useEffect(()=>{let cancelled=false;
  api<{indexed:boolean;threshold:number;results:Similar[]}>("GET","/api/vulnerabilities/"+vulnId+"/similar?limit=5")
   .then(d=>{if(!cancelled)setState({kind:"ok",...d});})
   .catch((e:Error)=>{if(!cancelled)setState({kind:"error",message:e.message});});
  return()=>{cancelled=true;};
 },[vulnId]);
 if(state.kind==="loading")return <p className="text-sm text-muted">Searching Qdrant for similar reports...</p>;
 if(state.kind==="error")return <p className="text-sm text-bad">Similarity search unavailable: {state.message}</p>;
 return <div className="space-y-3">
  <p className="text-xs text-muted">Cosine similarity, same company only. Scores at or above {state.threshold} are flagged. Suggestions only; review remains a human decision.
   {!state.indexed?" This report is not indexed yet, so its query vector was generated on demand.":""}</p>
  {!state.results.length&&<p className="text-sm text-muted">No other indexed reports from this company.</p>}
  <ul className="space-y-2">{state.results.map(r=><li key={r.vuln_id} className={"rounded-lg border p-3 "+(r.likely_duplicate?"border-warn/50 bg-warn/5":"border-line")}>
   <div className="flex items-center justify-between gap-2"><Link className="link text-sm font-medium" href={"/admin/reports/"+r.vuln_id}># {r.vuln_id} {r.title}</Link>
   <span className="font-mono text-sm tabular-nums">{r.score.toFixed(3)}</span></div>
   <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted"><StatusBadge value={r.status}/><span>{r.program_name}</span><span>by {r.researcher_name}</span>{r.likely_duplicate&&<b className="text-warn">likely duplicate</b>}</div>
  </li>)}</ul>
 </div>;
}
