// Evaluate positive and negative pairs to choose the similarity threshold.
import { readFileSync } from "node:fs";
import { main } from "./_env";
interface Pairs {positive:[number,number][];negative:[number,number][];}
main(async()=>{
 const {getPool}=await import("@/server/db/pools");
 const {select}=await import("@/server/db/query");
 const {embedTexts}=await import("@/server/vector/embedder");
 const {buildEmbeddingText,cosine}=await import("@/server/vector/text");
 const pairs=JSON.parse(readFileSync("scripts/data/similarity-pairs.json","utf8")) as Pairs;
 const ids=[...new Set([...pairs.positive,...pairs.negative].flat())];
 const rows=await select<{vuln_id:number;title:string;description:string|null}>(getPool("vector"),
  "SELECT vuln_id,title,description FROM VULNERABILITY WHERE vuln_id IN ("+ids.map(()=>" ?").join(",").trim()+")",ids);
 if(rows.length!==ids.length)throw new Error("Some labelled report ids are missing. Run the synthetic seed first.");
 const vectors=await embedTexts(rows.map(r=>buildEmbeddingText(r.title,r.description)));
 const byId=new Map(rows.map((r,i)=>[r.vuln_id,vectors[i]]));
 const score=([a,b]:[number,number])=>cosine(byId.get(a)!,byId.get(b)!);
 const pos=pairs.positive.map(score),neg=pairs.negative.map(score);
 console.log("positive:",pos.map(x=>x.toFixed(3)).join(" "));
 console.log("negative:",neg.map(x=>x.toFixed(3)).join(" "));
 console.log("\nthreshold precision recall f1");let best={t:0,f1:-1};
 for(let t=0.3;t<=0.951;t+=0.05){
  const tp=pos.filter(s=>s>=t).length,fp=neg.filter(s=>s>=t).length;
  const precision=tp+fp?tp/(tp+fp):1,recall=tp/pos.length;
  const f1=precision+recall?2*precision*recall/(precision+recall):0;
  if(f1>best.f1)best={t,f1};
  console.log(t.toFixed(2),precision.toFixed(2),recall.toFixed(2),f1.toFixed(2));
 }
 console.log("\nSuggested SIMILARITY_THRESHOLD="+best.t.toFixed(2)+" (F1 "+best.f1.toFixed(2)+").");
});
