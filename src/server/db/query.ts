// Parameterized query helpers for mysql2; user input never becomes SQL syntax.
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
type Executor = Pool | PoolConnection;
export type Row = Record<string, unknown>;

export async function select<T = Row>(db: Executor, sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows as unknown as T[];
}
export async function selectOne<T = Row>(db: Executor, sql: string, params: unknown[] = []): Promise<T | null> {
  return (await select<T>(db, sql, params))[0] ?? null;
}
export async function execute(db: Executor, sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await db.query<ResultSetHeader>(sql, params);
  return result;
}
/** Stored procedure names are allow-listed; values use placeholders. */
export async function callProcedure(db: Executor, name: string, params: unknown[] = []): Promise<Row[][]> {
  if (!/^sp_[a-z_]+$/.test(name)) throw new Error(`Refusing procedure name: ${name}`);
  const placeholders = params.map(() => "?").join(", ");
  const [result] = await db.query(`CALL ${name}(${placeholders})`, params);
  if (!Array.isArray(result)) return [];
  return (result as unknown[]).filter((part): part is Row[] => Array.isArray(part));
}
