// npm run vector:sync processes pending outbox jobs; --watch polls every 5 seconds.
import { main } from "./_env";
const watch=process.argv.includes("--watch");
main(async()=>{
 const {processPendingJobs}=await import("@/server/vector/sync");
 do{const r=await processPendingJobs();if(r.processed||r.failed||!watch)console.log(new Date().toISOString(),r);
  if(watch)await new Promise(resolve=>setTimeout(resolve,5000));
 }while(watch);
});
