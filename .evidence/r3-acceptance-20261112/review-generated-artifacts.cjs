const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {unzipSync}=require('fflate');
const root=path.resolve(__dirname,'../..');
const text=fs.readFileSync(path.join(root,'playwright-report/index.html'),'utf8');
const match=text.match(/data:application\/zip;base64,([A-Za-z0-9+/=]+)/);
const env=require('dotenv').parse(fs.readFileSync(path.join(root,'.env.local')));
const knownKeys=['JWT_SECRET','ADMIN_JWT_SECRET','JWT_REFRESH_SECRET','INTERNAL_GATEWAY_SECRET','INTERNAL_API_SECRET','GATEWAY_TRUST_SECRET'];
const violations=[];
let embeddedFiles=0;
if(match) {
  for(const [filename,bytes] of Object.entries(unzipSync(Buffer.from(match[1],'base64')))) {
    embeddedFiles++;
    const body=Buffer.from(bytes).toString('utf8');
    for(const key of knownKeys)if(env[key] && env[key].length>=12 && body.includes(env[key]))violations.push({kind:'configured-secret',key,file:filename});
    if(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(body))violations.push({kind:'JWT-like-string',file:filename});
  }
}
const nextEnv=['skillhubcore-admin','skillup-web','realtutorialhub-web'].map(app=>({app,routeReference:fs.readFileSync(path.join(root,'apps',app,'next-env.d.ts'),'utf8').split(/\r?\n/).find(line=>line.startsWith('import '))}));
fs.writeFileSync(path.join(__dirname,'generated-artifact-review.json'),JSON.stringify({boundary:'Inspect committed/generated type glue and unpack embedded Playwright report ZIP. Search configured current authentication/trust secrets and JWT-shaped strings without exposing their values. Not exhaustive secret detection or image OCR; report is historical evidence, not R3 execution proof.',report:{bytes:Buffer.byteLength(text),sha256:crypto.createHash('sha256').update(text).digest('hex'),embeddedZipFound:!!match,embeddedFiles,violations},nextEnv},null,2));
console.log(JSON.stringify({embeddedFiles,findings:violations.length}));
if(violations.length)process.exitCode=1;
