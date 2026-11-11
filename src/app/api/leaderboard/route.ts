import { ok,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
import { leaderboard } from "@/server/services/analytics";
export const GET=route(async()=>{const user=await requireApiUser();return ok(await leaderboard(user.role));});
