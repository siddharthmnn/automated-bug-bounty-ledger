"use client";
import { api } from "@/lib/api-client";
import { FormStatus,useAction } from "@/components/forms/useAction";
export function VectorSyncActions() {
 const {busy,error,message,run}=useAction();
 const go=(action:string,label:string)=>run(()=>api("POST","/api/admin/vector-sync",{action}),{success:label+" finished"});
 return <div className="space-y-2"><div className="flex flex-wrap gap-2">
  <button className="btn btn-primary" disabled={busy} onClick={()=>go("process","Processing")}>Process pending jobs</button>
  <button className="btn" disabled={busy} onClick={()=>go("retry-failed","Retry")}>Retry failed jobs</button>
  <button className="btn" disabled={busy} onClick={()=>go("reconcile","Reconcile")}>Reconcile MySQL and Qdrant</button>
 </div>{busy&&<p className="text-xs text-muted">The first run downloads and loads the embedding model.</p>}
 <FormStatus error={error} message={message}/></div>;
}
