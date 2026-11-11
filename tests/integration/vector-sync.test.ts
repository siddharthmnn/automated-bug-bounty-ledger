import { afterAll,beforeAll,describe,expect,it } from "vitest";
import { closePools,getPool } from "@/server/db/pools";
import { execute,selectOne } from "@/server/db/query";
import { collectionName,ensureCollection,getReportPoint,qdrant,searchSimilar } from "@/server/vector/qdrant";
import { processPendingJobs,reconcile } from "@/server/vector/sync";
import { testEmbed } from "../test-embedder";
import { closeTestRootPool,getTestRootPool } from "../helpers/root-db";
const deps={embed:testEmbed},admin=()=>getPool("admin"),root=getTestRootPool();
beforeAll(async()=>{
 expect(collectionName()).toBe("vulnerability_reports_test");
 if((await qdrant().collectionExists(collectionName())).exists)await qdrant().deleteCollection(collectionName());
 await ensureCollection();
 await execute(root,"UPDATE VECTOR_SYNC_JOB SET state='DONE' WHERE state<>'DONE'");
 await reconcile(deps);
 for(;;){const r=await processPendingJobs(deps,200);if(r.processed+r.failed===0)break;expect(r.failed).toBe(0);}
});
afterAll(async()=>{await closePools();await closeTestRootPool();});
describe("MySQL outbox to Qdrant",()=>{
 it("indexes every MySQL report and stores its payload",async()=>{
  const {n}= (await selectOne<{n:number}>(admin(),"SELECT COUNT(*) n FROM VULNERABILITY"))!;
  const {count}=await qdrant().count(collectionName(),{exact:true});expect(count).toBe(n);
  expect((await getReportPoint(301))?.payload).toMatchObject({vuln_id:301,company_id:1,program_id:101,status:"ACCEPTED"});
 });
 it("updates payload without changing the vector when only status changes",async()=>{
  const before=await getReportPoint(303,true);
  const next=before?.payload?.status==="REJECTED"?"TRIAGED":"REJECTED";
  await execute(root,"UPDATE VULNERABILITY SET status=? WHERE vuln_id=303",[next]);
  const run=await processPendingJobs(deps);expect(run.outcomes["payload-updated"]).toBeGreaterThanOrEqual(1);
  const after=await getReportPoint(303,true);expect(after?.payload?.status).toBe(next);expect(after?.vector).toEqual(before?.vector);
 });
 it("embeds new text and deletes points when the MySQL row is deleted",async()=>{
  const {insertId}=await execute(root,"INSERT INTO VULNERABILITY(title,description,severity,submitted_date,program_id,researcher_id) VALUES('Temporary vector row','Webhook callback reaches internal metadata service','LOW',CURDATE(),101,201)");
  expect((await processPendingJobs(deps)).outcomes.upserted).toBeGreaterThanOrEqual(1);expect(await getReportPoint(insertId)).not.toBeNull();
  await execute(root,"DELETE FROM VULNERABILITY WHERE vuln_id=?",[insertId]);
  expect((await processPendingJobs(deps)).outcomes.deleted).toBeGreaterThanOrEqual(1);expect(await getReportPoint(insertId)).toBeNull();
 });
 it("finds a labelled duplicate within the same company",async()=>{
  const point=await getReportPoint(317,true);
  const hits=await searchSimilar(point!.vector as number[],{companyId:3,excludeVulnId:317,limit:3});
  expect(hits.every(h=>h.payload.company_id===3)).toBe(true);expect(hits.map(h=>h.vulnId)).toContain(316);
 });
 it("reconciles a missing point",async()=>{
  await qdrant().delete(collectionName(),{wait:true,points:[302]});
  const diff=await reconcile(deps);expect(diff.queuedUpserts).toBe(1);
  await processPendingJobs(deps);expect(await getReportPoint(302)).not.toBeNull();
 });
});
