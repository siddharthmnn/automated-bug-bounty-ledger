// npm run qdrant:init creates the collection and payload indexes.
import { main } from "./_env";
main(async()=>{
 const {collectionName,ensureCollection,qdrant}=await import("@/server/vector/qdrant");
 const name=collectionName(),result=await ensureCollection(name),info=await qdrant().getCollection(name);
 console.log("Collection "+name+": "+result);
 console.log(JSON.stringify({status:info.status,points:info.points_count,vectors:info.config.params.vectors,payload_schema:info.payload_schema},null,2));
});
