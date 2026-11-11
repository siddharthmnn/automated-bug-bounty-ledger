import { ok,route } from "@/server/http";
import { requireApiUser } from "@/server/auth/guard";
export const GET=route(async()=>ok(await requireApiUser()));
