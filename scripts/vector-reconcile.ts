// Compare MySQL source rows and Qdrant points, queue drift fixes, then apply them.
import { main } from "./_env";
main(async()=>{
 const {reconcile,processPendingJobs}=await import("@/server/vector/sync");
 const diff=await reconcile();console.log("Drift:",diff);
 if(diff.queuedUpserts+diff.queuedDeletes>0)console.log("Applied:",await processPendingJobs());
});
