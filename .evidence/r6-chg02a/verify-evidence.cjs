const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');process.chdir(root);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const paths=[
 'packages/types/src/tutorial-repositories.types.ts',
 'services/skillhubcore-service/src/modules/user/user.repository.ts',
 'services/skillhubcore-service/src/modules/auth/auth.service.ts',
 'services/skillhubcore-service/src/modules/auth/auth.routes.ts',
 'services/skillhubcore-service/src/modules/auth/token-rotation.service.ts',
 'services/skillhubcore-service/src/modules/auth/__tests__/auth.service.test.ts',
 'services/skillhubcore-service/src/modules/auth/__tests__/token-rotation.service.test.ts',
 'services/skillhubcore-service/src/modules/user/__tests__/user.repository.test.ts',
];
const baseline=read('.evidence/r6-chg02a/BASELINE.json');
const r6=read('.evidence/r6-existing-p1/FINAL_SOURCE_MANIFEST.json');
const chg01=read('.evidence/r6-chg01b/FINAL_VERIFICATION.json');
const p0=read('.evidence/r6-report-p0/FINAL_SOURCE_AND_SCOPE.json');
const protectedFiles=[
 ...chg01.exactChangedSourceAndTests.map(f=>({path:f.path,expected:f.after})),
 ...r6.changedBaselineFiles.map(f=>({path:f.path,expected:f.after})),
 ...r6.additionalScopedFiles.filter(f=>f.path.startsWith('apps/')||f.path.startsWith('src/')).map(f=>({path:f.path,expected:f.sha256})),
 ...p0.comparison.filter(f=>f.path.startsWith('apps/')||f.path.startsWith('src/')).map(f=>({path:f.path,expected:f.currentSha256})),
 {path:'apps/api-server/src/modules/auth/shc-auth.service.ts',expected:baseline.hashes['apps/api-server/src/modules/auth/shc-auth.service.ts']},
 {path:'apps/skillup-web/next-env.d.ts',expected:baseline.hashes['apps/skillup-web/next-env.d.ts']},
 {path:'docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv',expected:r6.ledgerSha256},
 {path:'.evidence/r3-acceptance-20261112/Q01_Q48_REGISTER.md',expected:r6.originalRegisterSha256},
];
const comparisons=protectedFiles.map(f=>({...f,current:hash(f.path),matches:hash(f.path)===f.expected}));
const logs=fs.readdirSync(__dirname).filter(p=>p.endsWith('.log')).map(p=>({file:p,sha256:hash(path.join(__dirname,p))}));
const fixturePatterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
const artifacts=[...paths,...fs.readdirSync(__dirname).filter(p=>fs.statSync(path.join(__dirname,p)).isFile()).map(p=>path.join(__dirname,p))];
const findings=[];for(const p of artifacts){const s=fs.readFileSync(p,'utf8');if(fixturePatterns.some(pattern=>pattern.test(s))) findings.push({path:p,kind:'private-key block'});}
const result={captured:new Date().toISOString(),baselineHead:baseline.head,headNow:fs.readFileSync('.git/refs/heads/main','utf8').trim(),modifiedSourceAndTests:paths.map(p=>({path:p,sha256:hash(p),before:baseline.hashes[p]})),protectedSourceComparisons:comparisons,protectedMismatches:comparisons.filter(f=>!f.matches),quality:read('.evidence/r6-chg02a/QUALITY_RESULTS.json'),additionalQuality:read('.evidence/r6-chg02a/ADDITIONAL_QUALITY_RESULTS.json'),shcCompatibility:read('.evidence/r6-chg02a/SHC_COMPATIBILITY_RESULT.json'),finalServiceBuildExit:Number(fs.readFileSync('.evidence/r6-chg02a/service-build-final.exit','utf8').trim()),graphifyExit:Number(fs.readFileSync('.evidence/r6-chg02a/graphify-update-final.exit','utf8').trim()),tests:{service:38,chg01b:38,shc:3,total:79},sharedTypesLint:read('.evidence/r6-chg02a/SHARED_TYPES_LINT_COMPARISON.json'),privateKeyFindings:findings,logHashes:logs,limitations:['Controlled persistence and mocked provider boundaries. No PostgreSQL or browser execution.','Shared-types zero-warning lint remains failed with identical pre-existing diagnostics.','No whole-worktree status claim. Previously existing and concurrent owner/model changes outside this manifest are unclassified.']};
fs.writeFileSync(path.join(__dirname,'FINAL_VERIFICATION.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({sourceFiles:paths.length,protectedComparisons:comparisons.length,protectedMismatches:result.protectedMismatches,graphifyExit:result.graphifyExit,serviceBuildExit:result.finalServiceBuildExit,tests:result.tests,privateKeyFindings:findings}));
if(result.protectedMismatches.length||result.graphifyExit||result.finalServiceBuildExit||findings.length)process.exitCode=1;
