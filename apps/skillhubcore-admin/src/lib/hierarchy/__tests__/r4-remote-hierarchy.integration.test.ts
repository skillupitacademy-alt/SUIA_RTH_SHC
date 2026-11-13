import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ main: undefined as unknown, tutorial: undefined as unknown, unavailable: false, failAfterDelete: false }));
vi.mock('@quiz/db', async importOriginal => ({ ...await importOriginal<typeof import('@quiz/db')>(), getDb: () => state.main }));
vi.mock('@quiz/db-tutorial', async importOriginal => ({
  ...await importOriginal<typeof import('@quiz/db-tutorial')>(),
  db: new Proxy({}, { get: (_target, key) => {
    if (state.unavailable) throw new Error('R4 isolated TutorialDB outage');
    return Reflect.get(state.tutorial as object, key);
  } }),
}));
import { AcademicHierarchyService } from '../academic-hierarchy.service';
import { assertMainHierarchyRelationship, withHierarchyDeletionLocks, withMainHierarchyLocks } from '@quiz/db-tutorial';

describe.skipIf(process.env.RUN_HIERARCHY_REMOTE_UAT !== '1')('R4 real topic/subtopic and cross-database integrity', () => {
  const tag = `r4-hierarchy-${randomUUID()}`;
  const owned = { domains: [] as string[], subjects: [] as string[], topics: [] as string[], subtopics: [] as string[], tutorial_domains: [] as string[], tutorial_subjects: [] as string[], tutorial_topics: [] as string[], tutorial_subtopics: [] as string[], tutorial_sections: [] as string[], tutorial_sidebar_trees_v2: [] as string[] };
  const observations: Array<{scenario:string;status:number;mainParentPresent?:boolean;tutorialDependencyPresent?:boolean}> = [];
  let main: Pool;
  let tutorial: Pool;
  beforeAll(async () => {
    neonConfig.webSocketConstructor = WebSocket;
    const env = parse(readFileSync(path.resolve('../../.env.local')));
    main = new Pool({connectionString:env.DATABASE_URL,max:4,connectionTimeoutMillis:10000,statement_timeout:15000});
    tutorial = new Pool({connectionString:env.DATABASE_DIRECT_URL_TUTORIAL || env.DATABASE_URL_TUTORIAL,max:2,connectionTimeoutMillis:10000,statement_timeout:15000});
    const database = drizzle(main);
    state.main = { select: database.select.bind(database), transaction: <T>(operation:Parameters<typeof database.transaction<T>>[0]) => database.transaction(async tx => {
      const result = await operation(tx);
      if (state.failAfterDelete) throw new Error('R4 isolated post-delete rollback');
      return result;
    }) };
    state.tutorial = drizzle(tutorial);
  });
  async function mainHierarchy(child = true) {
    const domain = randomUUID(); const subject = randomUUID(); const topic = randomUUID(); const subtopic = randomUUID();
    await main.query('INSERT INTO domains(id,name) VALUES($1,$2)',[domain,`${tag}-${domain}`]); owned.domains.push(domain);
    await main.query('INSERT INTO subjects(id,domain_id,name) VALUES($1,$2,$3)',[subject,domain,`${tag}-${subject}`]); owned.subjects.push(subject);
    await main.query('INSERT INTO topics(id,subject_id,name) VALUES($1,$2,$3)',[topic,subject,`${tag}-${topic}`]); owned.topics.push(topic);
    if (child) { await main.query('INSERT INTO subtopics(id,topic_id,name) VALUES($1,$2,$3)',[subtopic,topic,`${tag}-${subtopic}`]); owned.subtopics.push(subtopic); }
    return {domain,subject,topic,subtopic};
  }
  async function sidebar(hierarchy: Awaited<ReturnType<typeof mainHierarchy>>, client: Pick<Pool,'query'> = tutorial) {
    const id = randomUUID();
    await client.query("INSERT INTO tutorial_sidebar_trees_v2(id,brand_id,domain_id,subject_id,topic_id,tree,source_content) VALUES($1,'shared',$2,$3,$4,$5,$6)",[id,hierarchy.domain,hierarchy.subject,hierarchy.topic,{topics:[]},tag]);
    owned.tutorial_sidebar_trees_v2.push(id);
    return id;
  }
  async function section(hierarchy: Awaited<ReturnType<typeof mainHierarchy>>) {
    const ids = [randomUUID(),randomUUID(),randomUUID(),randomUUID()];
    for (const [index, table, parent] of [[0,'tutorial_domains',null],[1,'tutorial_subjects','domain_id'],[2,'tutorial_topics','subject_id'],[3,'tutorial_subtopics','topic_id']] as const) {
      const external = [hierarchy.domain,hierarchy.subject,hierarchy.topic,hierarchy.subtopic][index];
      if (parent) await tutorial.query(`INSERT INTO ${table}(id,external_id,${parent},name,slug) VALUES($1,$2,$3,$4,$5)`,[ids[index],external,ids[index-1],`${tag}-${index}`,`${tag}-${index}`]);
      else await tutorial.query('INSERT INTO tutorial_domains(id,external_id,name,slug) VALUES($1,$2,$3,$4)',[ids[index],external,tag,tag]);
      owned[table].push(ids[index]);
    }
    const id = randomUUID();
    await tutorial.query("INSERT INTO tutorial_sections(id,subtopic_id,navigation_node_id,content,status,deleted_at) VALUES($1,$2,$3,$4,'draft',now())",[id,ids[3],tag,{schemaVersion:1,blocks:[]}]); owned.tutorial_sections.push(id);
    return id;
  }
  afterAll(async () => {
    state.unavailable = false; state.failAfterDelete = false;
    let cleanupVerified = false;
    try {
      for (const table of ['tutorial_sections','tutorial_sidebar_trees_v2','tutorial_subtopics','tutorial_topics','tutorial_subjects','tutorial_domains'] as const) {
        await tutorial.query(`DELETE FROM ${table} WHERE id=ANY($1::uuid[])`,[owned[table]]);
      }
      for (const table of ['subtopics','topics','subjects','domains'] as const) await main.query(`DELETE FROM ${table} WHERE id=ANY($1::uuid[])`,[owned[table]]);
      const counts = await Promise.all(Object.entries(owned).map(async ([table,ids]) => Number((await (table.startsWith('tutorial_') ? tutorial : main).query(`SELECT count(*) AS n FROM ${table} WHERE id=ANY($1::uuid[])`,[ids])).rows[0].n)));
      cleanupVerified = counts.every(count=>count===0);
      expect(cleanupVerified).toBe(true);
    } finally {
      await Promise.all([main.end(),tutorial.end()]);
      writeFileSync(path.resolve('../../.evidence/r4-acceptance-20261112/hierarchy-remote-results.json'),JSON.stringify({boundary:'Actual production hierarchy service with real MainDB/TutorialDB connections. Provider injection selects real connections and explicit outage/rollback faults. Only run-created hierarchy, unpublished dependency fixtures and exact-UUID cleanup.',observations,cleanupVerified},null,2));
    }
  });
  it('deletes an empty topic after actual TutorialDB dependency lookup',async()=>{
    const h=await mainHierarchy(false);
    const result=await AcademicHierarchyService.deleteTopic(h.topic);
    expect(result.status).toBe(200); observations.push({scenario:'empty topic deletion',status:result.status});
  });
  it('retains a topic with a physically retained soft-deleted subtopic',async()=>{
    const h=await mainHierarchy();
    await main.query('UPDATE subtopics SET deleted_at=now() WHERE id=$1',[h.subtopic]);
    const result=await AcademicHierarchyService.deleteTopic(h.topic);
    expect(result.status).toBe(409); observations.push({scenario:'soft-deleted subtopic dependency',status:result.status});
  });
  it('deletes an empty subtopic through the production transaction',async()=>{
    const h=await mainHierarchy();
    const result=await AcademicHierarchyService.deleteSubtopic(h.subtopic);
    expect(result.status).toBe(200); observations.push({scenario:'empty subtopic deletion',status:result.status});
  });
  it('blocks topic deletion for an actual TutorialDB sidebar dependency',async()=>{
    const h=await mainHierarchy(false); await sidebar(h);
    const result=await AcademicHierarchyService.deleteTopic(h.topic);
    expect(result.status).toBe(409); observations.push({scenario:'cross-database sidebar dependency',status:result.status});
  });
  it('blocks subtopic deletion for an actual retained TutorialDB section',async()=>{
    const h=await mainHierarchy(); await section(h);
    const result=await AcademicHierarchyService.deleteSubtopic(h.subtopic);
    expect(result.status).toBe(409); observations.push({scenario:'cross-database retained section dependency',status:result.status});
  });
  it('fails closed and preserves MainDB when TutorialDB cannot be checked',async()=>{
    const h=await mainHierarchy(false); state.unavailable=true;
    let result;
    try {result=await AcademicHierarchyService.deleteTopic(h.topic);} finally {state.unavailable=false;}
    expect(result.status).toBe(503);
    expect((await main.query('SELECT id FROM topics WHERE id=$1',[h.topic])).rowCount).toBe(1);
    observations.push({scenario:'TutorialDB outage retains MainDB parent',status:result.status});
  });
  it('rolls back a real MainDB topic deletion after cross-database reads',async()=>{
    const h=await mainHierarchy(false); state.failAfterDelete=true;
    let result;
    try {result=await AcademicHierarchyService.deleteTopic(h.topic);} finally {state.failAfterDelete=false;}
    expect(result.status).toBe(500);
    expect((await main.query('SELECT id FROM topics WHERE id=$1',[h.topic])).rowCount).toBe(1);
    observations.push({scenario:'MainDB rollback after TutorialDB preflight',status:result.status});
  });
  it('rejects actual orphan subtopic insertion at PostgreSQL FK',async()=>{
    await expect(main.query('INSERT INTO subtopics(id,topic_id,name) VALUES($1,$2,$3)',[randomUUID(),randomUUID(),tag])).rejects.toMatchObject({code:'23503'});
    observations.push({scenario:'subtopic FK',status:409});
  });
  it('waits for a coordinated in-flight writer and rejects deletion after its commit',async()=>{
    const h=await mainHierarchy(false);
    let entered!: () => void; let release!: () => void;
    const ready=new Promise<void>(resolve=>{entered=resolve;});
    const proceed=new Promise<void>(resolve=>{release=resolve;});
    const writing=withMainHierarchyLocks({topicIds:[h.topic]},async()=>{
      const writer=await tutorial.connect();
      try {await writer.query('BEGIN');await sidebar(h,writer);entered();await proceed;await writer.query('COMMIT');}
      finally {await writer.query('ROLLBACK');writer.release();}
    });
    await ready;
    let completed=false;
    const deleting=AcademicHierarchyService.deleteTopic(h.topic).then(result=>{completed=true;return result;});
    try {await new Promise(resolve=>setTimeout(resolve,100));expect(completed).toBe(false);}
    finally {release();}
    await writing;
    const result=await deleting;
    const mainParentPresent=(await main.query('SELECT id FROM topics WHERE id=$1',[h.topic])).rowCount===1;
    observations.push({scenario:'coordinated write-first commit blocks MainDB deletion',status:result.status,mainParentPresent});
    expect(result.status).toBe(409);expect(mainParentPresent).toBe(true);
  });
  it('rejects a waiting writer after the deletion commits first',async()=>{
    const h=await mainHierarchy(false); const deleting=await main.connect();
    try {
      await deleting.query('BEGIN'); await deleting.query('SELECT id FROM topics WHERE id=$1 FOR UPDATE',[h.topic]);
      let wrote=false;
      const writing=withMainHierarchyLocks({topicIds:[h.topic]},async()=>{wrote=true;await sidebar(h);});
      const rejected=expect(writing).rejects.toThrow();
      await new Promise(resolve=>setTimeout(resolve,100));
      await deleting.query('DELETE FROM topics WHERE id=$1',[h.topic]);await deleting.query('COMMIT');
      await rejected;expect(wrote).toBe(false);
      observations.push({scenario:'delete-first prevents stale writer commit',status:409});
    } finally {await deleting.query('ROLLBACK');deleting.release();}
  });
  it('times out a blocked writer without executing its TutorialDB write and permits a later retry',async()=>{
    const h=await mainHierarchy(false);const blocker=await main.connect();
    try {
      await blocker.query('BEGIN');await blocker.query('SELECT id FROM topics WHERE id=$1 FOR UPDATE',[h.topic]);
      let wrote=false;
      await expect(withMainHierarchyLocks({topicIds:[h.topic]},async()=>{wrote=true;})).rejects.toThrow();
      expect(wrote).toBe(false);await blocker.query('ROLLBACK');
      await withMainHierarchyLocks({topicIds:[h.topic]},async()=>{wrote=true;});expect(wrote).toBe(true);
      observations.push({scenario:'lock timeout fails closed and retry succeeds',status:200});
    } finally {await blocker.query('ROLLBACK');blocker.release();}
  });
  it('rolls back a TutorialDB writer before releasing its parent lock',async()=>{
    const h=await mainHierarchy(false);let id='';
    await expect(withMainHierarchyLocks({topicIds:[h.topic]},async()=>{
      const writer=await tutorial.connect();
      try {await writer.query('BEGIN');id=await sidebar(h,writer);throw new Error('R4 writer failure');}
      finally {await writer.query('ROLLBACK');writer.release();}
    })).rejects.toThrow('R4 writer failure');
    expect((await tutorial.query('SELECT id FROM tutorial_sidebar_trees_v2 WHERE id=$1',[id])).rowCount).toBe(0);
    expect((await AcademicHierarchyService.deleteTopic(h.topic)).status).toBe(200);
    observations.push({scenario:'TutorialDB rollback finishes before parent lock release',status:200});
  });
  it('retains a committed TutorialDB dependency after MainDB transaction completion fails',async()=>{
    const h=await mainHierarchy(false);let id='';state.failAfterDelete=true;
    try {await expect(withMainHierarchyLocks({topicIds:[h.topic]},async()=>{id=await sidebar(h);})).rejects.toThrow();}
    finally {state.failAfterDelete=false;}
    expect((await main.query('SELECT id FROM topics WHERE id=$1',[h.topic])).rowCount).toBe(1);
    expect((await tutorial.query('SELECT id FROM tutorial_sidebar_trees_v2 WHERE id=$1',[id])).rowCount).toBe(1);
    expect((await AcademicHierarchyService.deleteTopic(h.topic)).status).toBe(409);
    observations.push({scenario:'partial completion retains parent and committed dependency',status:409});
  });
  it('rejects a worker event with a mismatched academic parent chain under the lock',async()=>{
    const h=await mainHierarchy();let wrote=false;
    await expect(withMainHierarchyLocks({subtopicIds:[h.subtopic]},async()=>{
      await assertMainHierarchyRelationship({domainId:h.domain,subjectId:h.subject,topicId:randomUUID(),subtopicId:h.subtopic});
      wrote=true;
    })).rejects.toThrow('Hierarchy relationship mismatch');
    expect(wrote).toBe(false);
    observations.push({scenario:'worker hierarchy relationship mismatch rejected',status:409});
  });
  it('blocks the alternate backend deletion coordinator for retained TutorialDB records',async()=>{
    const h=await mainHierarchy(false);await sidebar(h);let deleted=false;
    await expect(withHierarchyDeletionLocks('topic',[h.topic],async()=>{deleted=true;})).rejects.toMatchObject({status:409});
    expect(deleted).toBe(false);
    observations.push({scenario:'alternate backend deletion respects TutorialDB retention',status:409});
  });
});
