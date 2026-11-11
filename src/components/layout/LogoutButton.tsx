"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";
export function LogoutButton() {
  const router=useRouter(); const [busy,setBusy]=useState(false);
  return <button className="btn btn-sm w-full" disabled={busy} onClick={async()=>{
    setBusy(true); await api("POST","/api/auth/logout").catch(()=>undefined);
    router.push("/login"); router.refresh();
  }}>{busy?"Signing out...":"Log out"}</button>;
}
