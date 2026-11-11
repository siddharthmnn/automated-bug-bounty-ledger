import { describe,expect,it } from "vitest";
import { buildEmbeddingText,cosine,textHash } from "@/server/vector/text";
describe("embedding text",()=>{
 it("collapses whitespace so formatting edits do not re-embed",()=>{
  expect(buildEmbeddingText("  A   title ","line one\n\n line   two")).toBe("A title\n\nline one line two");
  expect(textHash(buildEmbeddingText("A title","x"))).toBe(textHash(buildEmbeddingText("A  title"," x ")));
 });
 it("computes cosine similarity",()=>{
  expect(cosine([1,0],[1,0])).toBeCloseTo(1);expect(cosine([1,0],[0,1])).toBeCloseTo(0);
  expect(cosine([1,1],[-1,-1])).toBeCloseTo(-1);expect(cosine([1],[1,0])).toBe(0);
 });
});
