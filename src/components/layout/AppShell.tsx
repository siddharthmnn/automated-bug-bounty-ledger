import Link from "next/link";
import type { SessionUser } from "@/server/auth/session";
import { StatusBadge } from "@/components/ui/Badge";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { NavLinks,type NavItem } from "@/components/layout/NavLinks";
const ADMIN_NAV:NavItem[]=[
 {href:"/admin",label:"Dashboard"},{href:"/admin/reports",label:"Reports"},
 {href:"/admin/companies",label:"Companies"},{href:"/admin/programs",label:"Programs"},
 {href:"/admin/patches",label:"Patches"},{href:"/admin/payouts",label:"Payouts"},
 {href:"/admin/researchers",label:"Researchers"},{href:"/admin/analytics",label:"SQL analytics"},
 {href:"/admin/search",label:"Search"},{href:"/leaderboard",label:"Leaderboard"},
 {href:"/admin/system/vector-sync",label:"Vector sync"},{href:"/admin/system/database-roles",label:"Database roles"}
];
const RESEARCHER_NAV:NavItem[]=[
 {href:"/researcher",label:"Dashboard"},{href:"/researcher/programs",label:"Programs"},
 {href:"/researcher/submit",label:"Submit report"},{href:"/researcher/reports",label:"My reports"},
 {href:"/researcher/payouts",label:"My payouts"},{href:"/leaderboard",label:"Leaderboard"}
];
export function AppShell({user,children}:{user:SessionUser;children:React.ReactNode}) {
 const nav=user.role==="ADMIN"?ADMIN_NAV:RESEARCHER_NAV;
 return <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
  <a className="skip-link" href="#main-content">Skip to main content</a>
  <aside className="border-b border-line bg-panel lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
   <div className="flex h-full flex-col gap-6 p-4">
    <Link href={user.role==="ADMIN"?"/admin":"/researcher"} className="flex items-center gap-2 px-2">
     <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/20 font-mono text-sm font-bold text-accent">BB</span>
     <span className="leading-tight"><span className="block text-sm font-semibold">Bug Bounty Ledger</span><span className="block text-[11px] text-muted">Patch &amp; payout tracking</span></span>
    </Link>
    <NavLinks items={nav}/>
    <div className="mt-auto space-y-3 rounded-lg border border-line p-3">
     <div className="text-sm font-medium">{user.displayName}</div>
     <div className="flex items-center justify-between gap-2"><span className="truncate text-xs text-muted">{user.email}</span><StatusBadge value={user.role}/></div>
     <LogoutButton/>
    </div>
   </div>
  </aside>
  <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-8">{children}</main>
 </div>;
}
