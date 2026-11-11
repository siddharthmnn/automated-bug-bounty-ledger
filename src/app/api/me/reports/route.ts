import { ok,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { listMyReports } from "@/server/services/vulnerabilities";
export const GET=route(async()=>ok(await listMyReports(await requireApiUser("RESEARCHER"))));
