"use client";
import { useState } from "react";
import { api } from "@/lib/api-client";
interface Probe{id:string;account:string;sql:string;}
export function PrivilegeProbes({probes}:{probes:readonly Probe[]}) {
 const [results,setResults]=useState<Record<string,{allowed:boolean;message:string}>>({});
 const [busy,setBusy]=useState<string|null>(null);
 return <table className="table"><thead><tr><th>Account</th><th>Statement</th><th>MySQL response</th><th/></tr></thead><tbody>
 {probes.map(p=>{const r=results[p.id];return <tr key={p.id}>
  <td className="font-mono text-xs">app_{p.account}</td><td className="font-mono text-xs">{p.sql}</td>
  <td className={"text-xs "+(r?(r.allowed?"text-warn":"text-ok"):"text-muted")}>{r?r.message:"not run"}</td><td>
   <button className="btn btn-sm" disabled={busy!==null} onClick={async()=>{
    setBusy(p.id);try{const res=await api<{allowed:boolean;message:string}>("POST","/api/admin/db-roles",{probe:p.id});setResults(s=>({...s,[p.id]:res}));}
    finally{setBusy(null);}
   }}>{busy===p.id?"Running...":"Run"}</button>
  </td></tr>;})}
 </tbody></table>;
}
