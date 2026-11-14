const fs=require('node:fs');
const {chromium,request}=require('@playwright/test');
const dotenv=require('dotenv');
const credentials=dotenv.parse(fs.readFileSync('.env.auth-qualification.local'));
const plan=JSON.parse(fs.readFileSync('.local-secrets/r6-production-smoke-plan.json'));
const brand=process.env.R6_SMOKE_BRAND;
if(!['skillup','realtutorialhub'].includes(brand))throw new Error('Explicit learner brand required');
const origin=brand==='skillup'?'http://skillup.localhost:3009':'http://realtutorialhub.localhost:3003';
const prefix=brand==='skillup'?'TEST_SUIA_LEARNER':'TEST_RTH_LEARNER';
const selected=plan.tutorials[brand].selected[0];
const result={brand,origin,startedUtc:new Date().toISOString(),checks:[],scope:'Only affected canonical tutorial rendering and own progress read'};
const record=(name,actual,expected)=>result.checks.push({name,actual,expected,status:expected.includes(actual)?'PASS':'FAIL'});
let client,browser;
(async()=>{
 client=await request.newContext();
 const response=await client.post(origin+'/api/auth/login',{data:{email:credentials[prefix+'_EMAIL'],password:credentials[prefix+'_PASSWORD']},headers:{origin},timeout:65000});
 record('Login BFF',response.status(),[200]);if(!response.ok())return;
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({storageState:await client.storageState(),serviceWorkers:'block'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const page=await context.newPage();
 const tutorial=await page.goto(origin+selected.path,{waitUntil:'domcontentloaded',timeout:65000});
 record('Canonical tutorial HTTP',tutorial.status(),[200]);record('Canonical tutorial path retained',new URL(page.url()).pathname,[selected.path]);
 if(tutorial.ok()&&selected.expectedText){await page.waitForFunction(expected=>document.body.innerText.replace(/\s+/g,' ').includes(expected.replace(/\s+/g,' ')),selected.expectedText,{timeout:15000});record('Published lesson text rendered',true,[true]);}
 if(tutorial.ok())record('Own tutorial progress read',(await client.get(origin+'/api/tutorial/progress?subtopicId='+selected.subtopicId,{timeout:65000})).status(),[200]);
})().catch(error=>{result.failure=/timeout/i.test(error.message)?'TIMEOUT_65_SECONDS':error.name;}).finally(async()=>{
 if(client){const state=await client.storageState();const csrf=state.cookies.find(cookie=>cookie.name==='csrfToken')?.value;try{record('Fixture logout',(await client.post(origin+'/api/auth/logout',{headers:{origin,...(csrf?{'x-csrf-token':csrf}:{})},timeout:65000})).status(),[200]);}catch{result.logout='UNVERIFIED';}}
 await browser?.close();await client?.dispose();result.finishedUtc=new Date().toISOString();result.status=result.failure||result.logout||result.checks.some(check=>check.status!=='PASS')?'FAIL_OR_BLOCKED':'PASS';fs.writeFileSync('.evidence/r6-production-cutover/TUTORIAL-'+brand+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
});
