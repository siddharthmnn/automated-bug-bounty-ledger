"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export interface NavItem {href:string;label:string;}
export function NavLinks({items}:{items:NavItem[]}) {
 const pathname=usePathname();
 return <nav className="flex flex-col gap-0.5">{items.map(item=>{
  const active=pathname===item.href||(!["/admin","/researcher"].includes(item.href)&&pathname.startsWith(item.href));
  return <Link key={item.href} href={item.href} className={`rounded-lg px-3 py-2 text-sm transition ${active?"bg-accent/15 font-medium text-ink":"text-muted hover:bg-panel-2 hover:text-ink"}`}>{item.label}</Link>;
 })}</nav>;
}
