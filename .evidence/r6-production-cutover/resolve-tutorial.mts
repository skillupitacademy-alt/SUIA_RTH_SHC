import fs from 'node:fs';
import dotenv from 'dotenv';
Object.assign(process.env,dotenv.parse(fs.readFileSync('.env.local')));
for(const key of Object.keys(process.env))if(/QSTASH|UPSTASH|REDIS|SMTP|RESEND|GEMINI|OPENAI/.test(key))delete process.env[key];
process.env.PGOPTIONS='-c default_transaction_read_only=on';
const original=console.log;
const events:string[]=[];
console.log=(...args:unknown[])=>{const text=String(args[0]);if(/FAIL|SUCCESS|Failed to resolve|not found|null|Error/.test(text))events.push(text);};
console.error=(...args:unknown[])=>{events.push(String(args[0]));};
const plan=JSON.parse(fs.readFileSync('.local-secrets/r6-production-smoke-plan.json','utf8'));
const {resolveRuntimeContext}=await import('../../src/share-branding/LearningExperience/runtime/tutorialRuntimeResolver');
const results=[];
for(const brand of ['skillup','realtutorialhub']){
 for(const selection of plan.tutorials[brand].selected){
 const parts=selection.path.split('/').filter(Boolean);
 const start=events.length;
 try{const r=await resolveRuntimeContext({brandId:brand as 'skillup'|'realtutorialhub',learnerId:plan.accounts.find((a:{brand:string})=>a.brand===brand).userId,domainSlug:parts[1],subjectSlug:parts[2],topicSlug:parts[3],subtopicSlug:parts[4],navigationNodeId:parts[5]});results.push({brand,path:selection.path,success:r.success,reason:r.success?null:r.reason,blockCount:r.success?r.payload.content.blocks.length:null,events:events.slice(start)});}catch(e){results.push({brand,path:selection.path,failure:e instanceof Error?e.name:'unknown',events:events.slice(start)});}
 }
}
fs.writeFileSync('.evidence/r6-production-cutover/TUTORIAL_RESOLVER.json',JSON.stringify({boundary:'Current source resolver, configured database, diagnostic without application source changes',results},null,2));
original(JSON.stringify(results));process.exit(0);
