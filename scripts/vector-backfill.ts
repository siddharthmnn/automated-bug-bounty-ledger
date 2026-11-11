// First-time indexing or re-embedding after changing EMBEDDING_MODEL.
import { main } from "./_env";
main(async()=>{
 const {ensureCollection}=await import("@/server/vector/qdrant");
 const {enqueueAllReports,processPendingJobs}=await import("@/server/vector/sync");
 await ensureCollection();const queued=await enqueueAllReports();
 console.log("Queued "+queued+" reports. The first run downloads the embedding model (~90 MB).");
 let total={processed:0,failed:0};
 for(;;){const r=await processPendingJobs(undefined,50);
  total={processed:total.processed+r.processed,failed:total.failed+r.failed};
  console.log("Batch:",r);
  if(r.processed+r.failed===0||r.failed>0)break;
 }
 console.log("Backfill complete:",total);if(total.failed)process.exitCode=1;
});
