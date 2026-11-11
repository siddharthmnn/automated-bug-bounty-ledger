// Public vector-worker API. Kept stable for routes and CLI scripts.
export { processPendingJobs,enqueueAllReports,reconcile,MAX_ATTEMPTS } from "@/server/vector/sync-jobs";
export type { SyncRunResult } from "@/server/vector/sync-jobs";
export { syncReport } from "@/server/vector/sync-core";
export type { SyncDeps,SyncOutcome } from "@/server/vector/sync-core";
