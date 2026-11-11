import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/server/auth/guard";
export default async function ResearcherHome() {
 const user=await requirePageUser("RESEARCHER");
 return <PageHeader title={`Signed in as ${user.displayName}`} subtitle="The dashboard arrives in M6. Use the menu on the left."/>;
}
