"use client";
import { useSearchParams } from "next/navigation";
import { api,formValues } from "@/lib/api-client";
import { FormStatus,useAction } from "@/components/forms/useAction";
export function LoginForm() {
 const {busy,error,run}=useAction();const next=useSearchParams().get("next");
 return <form className="space-y-4" onSubmit={async e=>{
  e.preventDefault();const values=formValues(e.currentTarget);
  await run(async()=>{
   const res=await api<{redirectTo:string}>("POST","/api/auth/login",values);
   const target=next&&next.startsWith("/")&&!next.startsWith("//")?next:res.redirectTo;
   window.location.assign(target);
  });
 }}>
  <div><label className="label" htmlFor="email">E-mail</label><input className="input" id="email" name="email" type="email" autoComplete="email" required/></div>
  <div><label className="label" htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required/></div>
  <FormStatus error={error}/><button className="btn btn-primary w-full" disabled={busy}>{busy?"Signing in...":"Sign in"}</button>
 </form>;
}
