"use client";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { FormStatus,useAction } from "@/components/forms/useAction";
/** Two-step delete: click once to arm, again to confirm. */
export function DeleteButton({url,label,redirectTo}:{url:string;label:string;redirectTo:string}) {
 const {busy,error,run}=useAction();const [armed,setArmed]=useState(false);
 return <div className="space-y-2"><button className="btn btn-danger" disabled={busy}
  onClick={()=>armed?run(()=>api("DELETE",url),{redirectTo}):setArmed(true)}>
  {armed?`Confirm: ${label}`:label}</button><FormStatus error={error}/></div>;
}
