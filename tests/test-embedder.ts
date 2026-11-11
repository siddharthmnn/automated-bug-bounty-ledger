import { createHash } from "node:crypto";
import type { EmbedFn } from "@/server/vector/embedder";
/** Deterministic bag-of-words test double; not used by production inference. */
export const testEmbed:EmbedFn=async texts=>texts.map(text=>{
 const v=new Array<number>(384).fill(0);
 for(const word of text.toLowerCase().match(/[a-z0-9]+/g)??[]){
  const bucket=createHash("md5").update(word).digest().readUInt32BE(0)%384;v[bucket]++;
 }
 const norm=Math.sqrt(v.reduce((sum,x)=>sum+x*x,0))||1;
 return v.map(x=>x/norm);
});
