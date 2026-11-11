// Local all-MiniLM-L6-v2 embeddings: 384 dimensions, no external inference API.
import path from "node:path";
import { env as hf,pipeline,type FeatureExtractionPipeline } from "@huggingface/transformers";
import { env } from "@/server/env";
export type EmbedFn=(texts:string[])=>Promise<number[][]>;
hf.cacheDir=path.join(process.cwd(),".cache","transformers");
let extractor:Promise<FeatureExtractionPipeline>|null=null;
function getExtractor():Promise<FeatureExtractionPipeline> {
 if(!extractor)extractor=pipeline("feature-extraction",env().EMBEDDING_MODEL,{dtype:"fp32"}).catch(e=>{extractor=null;throw e;}) as Promise<FeatureExtractionPipeline>;
 return extractor;
}
export const embedTexts:EmbedFn=async texts=>{
 if(texts.length===0)return [];
 const model=await getExtractor();
 const output=await model(texts,{pooling:"mean",normalize:true});
 const vectors=output.tolist() as number[][];
 const dim=env().EMBEDDING_DIM;
 for(const vector of vectors)if(vector.length!==dim)throw new Error(`Embedding has ${vector.length} dimensions; expected ${dim}`);
 return vectors;
};
