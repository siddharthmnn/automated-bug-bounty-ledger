import { AppShell } from "@/components/layout/AppShell";
import { requirePageUser } from "@/server/auth/guard";
export default async function ResearcherLayout({children}:{children:React.ReactNode}) {
 const user=await requirePageUser("RESEARCHER");
 return <AppShell user={user}>{children}</AppShell>;
}
