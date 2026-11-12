"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function useAction() {
 const router=useRouter(); const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null); const [message,setMessage]=useState<string|null>(null);
 async function run<T>(fn:()=>Promise<T>,opts?:{success?:string;redirectTo?:string}):Promise<T|undefined> {
  setBusy(true);setError(null);setMessage(null);
  try {const result=await fn();if(opts?.success)setMessage(opts.success);if(opts?.redirectTo)router.push(opts.redirectTo);router.refresh();return result;}
  catch(e){setError(e instanceof Error?e.message:"Something went wrong");return undefined;}
  finally{setBusy(false);}
 }
 return {busy,error,message,run};
}
export function FormStatus({error,message}:{error:string|null;message?:string|null}) {
 if(error)return <p role="alert" aria-live="assertive" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>;
 if(message)return <p role="status" aria-live="polite" className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{message}</p>;
 return null;
}
