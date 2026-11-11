// Shared database-test helpers.
export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;
/** Return a rejected MySQL errno, or fail if the operation unexpectedly succeeds. */
export async function errnoOf(promise:Promise<unknown>):Promise<number|undefined> {
  try { await promise; }
  catch(e) { return (e as {errno?:number}).errno; }
  throw new Error("Expected the database to reject this statement, but it succeeded");
}
