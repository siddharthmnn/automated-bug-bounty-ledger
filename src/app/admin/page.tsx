import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/server/auth/guard";
export default async function AdminHome() {
 const user=await requirePageUser("ADMIN");
 return <PageHeader title={`Signed in as ${user.displayName}`} subtitle="The dashboard arrives in M6. Use the menu on the left."/>;
}
