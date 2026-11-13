const fs=require('fs'),path=require('path');
const endpoints=[
 ['API','http://localhost:3000/api/health'],
 ['SHC','http://skillhubcore.localhost:3007/login'],
 ['SUIA','http://skillup.localhost:3009/api/healthz'],
 ['RTH','http://realtutorialhub.localhost:3003/api/healthz'],
];
(async()=>{const results=await Promise.all(endpoints.map(async([app,url])=>{const attempts=[];for(let attempt=0;attempt<3;attempt++){try{const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(180000)});await response.arrayBuffer();attempts.push({status:response.status});if(response.status===200)return {app,url,status:200,attempts};}catch(error){attempts.push({error:error.name});}await new Promise(resolve=>setTimeout(resolve,5000));}return {app,url,status:null,attempts};}));fs.writeFileSync(path.join(__dirname,'local-server-health.json'),JSON.stringify({checked:new Date().toISOString(),results},null,2));console.log(results);if(results.some(row=>row.status!==200))process.exitCode=1;})().catch(error=>{console.error({name:error.name,code:error.code});process.exitCode=1});
