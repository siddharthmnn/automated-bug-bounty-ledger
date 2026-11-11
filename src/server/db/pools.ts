// Separate pools enforce database roles even if an application route is buggy.
import mysql, { type Pool } from "mysql2/promise";
import { env } from "@/server/env";
export type PoolKind = "auth" | "admin" | "researcher" | "vector";
type PoolCache = Partial<Record<PoolKind, Pool>>;
const globalForPools = globalThis as unknown as { __abblPools?: PoolCache };
const pools: PoolCache = globalForPools.__abblPools ?? (globalForPools.__abblPools = {});

function credentials(kind: PoolKind): { user: string; password: string } {
  const e = env();
  switch (kind) {
    case "auth": return { user: e.DB_AUTH_USER, password: e.DB_AUTH_PASSWORD };
    case "admin": return { user: e.DB_ADMIN_USER, password: e.DB_ADMIN_PASSWORD };
    case "researcher": return { user: e.DB_RESEARCHER_USER, password: e.DB_RESEARCHER_PASSWORD };
    case "vector": return { user: e.DB_VECTOR_USER, password: e.DB_VECTOR_PASSWORD };
  }
}
export function getPool(kind: PoolKind): Pool {
  if (pools[kind]) return pools[kind]!;
  const e = env();
  const pool = mysql.createPool({
    host:e.MYSQL_HOST, port:e.MYSQL_PORT, database:e.MYSQL_DATABASE,
    ...credentials(kind), connectionLimit:5, dateStrings:true,
    decimalNumbers:true, supportBigNumbers:true,
  });
  pools[kind] = pool;
  return pool;
}
export async function closePools(): Promise<void> {
  await Promise.all(Object.values(pools).map(p => p?.end()));
  for (const key of Object.keys(pools) as PoolKind[]) delete pools[key];
}
export function poolForRole(role:"ADMIN"|"RESEARCHER"):Pool {
  return getPool(role==="ADMIN" ? "admin" : "researcher");
}
