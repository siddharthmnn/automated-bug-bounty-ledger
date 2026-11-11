import { AppShell } from "@/components/layout/AppShell";
import { requirePageUser } from "@/server/auth/guard";
export default async function AdminLayout({children}:{children:React.ReactNode}) {
 const user=await requirePageUser("ADMIN");
 return <AppShell user={user}>{children}</AppShell>;
}
