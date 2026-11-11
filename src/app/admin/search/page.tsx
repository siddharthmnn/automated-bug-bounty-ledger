import { PageHeader } from "@/components/ui/PageHeader";
import { SearchCompare } from "@/components/forms/SearchCompare";
import { requirePageUser } from "@/server/auth/guard";
export default async function SearchPage() {
 await requirePageUser("ADMIN");
 return <><PageHeader title="Search" subtitle="The same query, two engines: MySQL FULLTEXT matches words, Qdrant matches meaning."/><SearchCompare/></>;
}
