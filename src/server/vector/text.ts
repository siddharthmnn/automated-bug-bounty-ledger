import { createHash } from "node:crypto";
/** Title + blank line + description; whitespace-only edits do not re-embed. */
export function buildEmbeddingText(title:string,description:string|null):string {
 const clean=(s:string)=>s.replace(/\s+/g," ").trim();
 return `${clean(title)}\n\n${clean(description??"")}`.trim();
}
export function textHash(text:string):string {
 return createHash("sha256").update(text).digest("hex");
}
export function cosine(a:number[],b:number[]):number {
 if(a.length!==b.length||a.length===0)return 0;
 let dot=0,na=0,nb=0;
 for(let i=0;i<a.length;i++){dot+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}
 return na===0||nb===0?0:dot/(Math.sqrt(na)*Math.sqrt(nb));
}
