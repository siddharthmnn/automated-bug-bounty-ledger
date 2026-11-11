"use client";
import { useState } from "react";
import Link from "next/link";
import { api,formValues } from "@/lib/api-client";
import { FormStatus,useAction } from "@/components/forms/useAction";
export function RegisterForm() {
 const {busy,error,run}=useAction();const [done,setDone]=useState(false);
 if(done)return <p className="text-sm">Account created. <Link className="link" href="/login">Sign in</Link> to submit your first report.</p>;
 return <form className="space-y-4" onSubmit={async e=>{
  e.preventDefault();const values=formValues(e.currentTarget);
  const created=await run(()=>api("POST","/api/auth/register",values));if(created)setDone(true);
 }}>
  <div><label className="label" htmlFor="name">Full name</label><input className="input" id="name" name="name" required minLength={2} maxLength={100}/></div>
  <div><label className="label" htmlFor="email">E-mail</label><input className="input" id="email" name="email" type="email" required maxLength={100}/></div>
  <div><label className="label" htmlFor="country">Country (optional)</label><input className="input" id="country" name="country" maxLength={50}/></div>
  <div><label className="label" htmlFor="password">Password (10+ characters, a letter and a digit)</label><input className="input" id="password" name="password" type="password" required minLength={10} maxLength={72} autoComplete="new-password"/></div>
  <FormStatus error={error}/><button className="btn btn-primary w-full" disabled={busy}>{busy?"Creating...":"Create researcher account"}</button>
 </form>;
}
