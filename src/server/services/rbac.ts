// Each fixed probe uses a separate least-privilege account; no arbitrary SQL input.
import { getPool,type PoolKind } from "@/server/db/pools";
import { select } from "@/server/db/query";
const ACCOUNTS:{kind:PoolKind;label:string}[]=[
 {kind:"auth",label:"Login and sessions"},{kind:"admin",label:"ADMIN requests"},
 {kind:"researcher",label:"RESEARCHER requests"},{kind:"vector",label:"Qdrant sync worker"}
];
export async function databaseGrants() {
 const out=[];
 for(const a of ACCOUNTS){
  const db=getPool(a.kind);
  const who=await select<{user:string;roles:string}>(db,"SELECT CURRENT_USER() user,CURRENT_ROLE() roles");
  const grants=await select<Record<string,string>>(db,"SHOW GRANTS");
  out.push({...a,user:who[0]?.user??"unknown",roles:who[0]?.roles??"NONE",grants:grants.map(g=>Object.values(g)[0])});
 }
 return out;
}
export const PRIVILEGE_PROBES=[
 {id:"researcher-read-payout",account:"researcher" as PoolKind,sql:"SELECT * FROM PAYOUT LIMIT 1"},
 {id:"researcher-read-users",account:"researcher" as PoolKind,sql:"SELECT email FROM RESEARCHER LIMIT 1"},
 {id:"admin-delete-payout",account:"admin" as PoolKind,sql:"DELETE FROM PAYOUT WHERE payout_id = -1"},
 {id:"admin-read-password-hash",account:"admin" as PoolKind,sql:"SELECT password_hash FROM APP_USER LIMIT 1"},
 {id:"admin-create-table",account:"admin" as PoolKind,sql:"CREATE TABLE rbac_probe_should_fail (id INT)"},
 {id:"researcher-view-leaderboard",account:"researcher" as PoolKind,sql:"SELECT name,total_earned FROM v_leaderboard_public LIMIT 1"}
] as const;
export async function runPrivilegeProbe(id:string) {
 const probe=PRIVILEGE_PROBES.find(p=>p.id===id);if(!probe)return null;
 try{const rows=await select(getPool(probe.account),probe.sql);return {...probe,allowed:true,message:`Allowed (${rows.length} row(s) returned)`};}
 catch(e){const err=e as {errno?:number};return {...probe,allowed:false,message:`MySQL error ${err.errno??"unknown"}: access denied as expected`};}
}
