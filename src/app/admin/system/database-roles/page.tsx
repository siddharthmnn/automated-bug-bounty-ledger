import { PageHeader } from "@/components/ui/PageHeader";
import { PrivilegeProbes } from "@/components/forms/PrivilegeProbes";
import { requirePageUser } from "@/server/auth/guard";
import { PRIVILEGE_PROBES,databaseGrants } from "@/server/services/rbac";
export default async function DatabaseRolesPage() {
 await requirePageUser("ADMIN");const accounts=await databaseGrants();
 return <>
  <PageHeader title="Database roles" subtitle="MySQL itself enforces the privilege boundary. Requests use separate auth, admin, researcher and vector accounts."/>
  <div className="mb-6 grid gap-6 xl:grid-cols-2">{accounts.map(a=><div key={a.kind} className="card">
   <div className="card-title">{a.label}</div><p className="mb-2 text-xs text-muted"><span className="font-mono">{a.user}</span> · active role <span className="font-mono">{a.roles}</span></p>
   <pre className="code max-h-72 overflow-auto whitespace-pre-wrap text-xs">{a.grants.join(";\n")}</pre>
  </div>)}</div>
  <div className="card overflow-x-auto"><div className="card-title">Live privilege probes</div>
   <p className="mb-3 text-sm text-muted">Each test is a fixed harmless statement. Access-denied responses are the expected result for restricted operations.</p>
   <PrivilegeProbes probes={PRIVILEGE_PROBES}/>
  </div>
 </>;
}
