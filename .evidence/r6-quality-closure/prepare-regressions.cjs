const fs=require('fs'),path=require('path');
const original=fs.readFileSync(path.join(__dirname,'run-quality.cjs'),'utf8');
const start=original.indexOf('const jobs=['),end=original.indexOf('\n];',start)+3;
const tests=['auth.branches2','auth.branches3','auth.logout.branch','auth.logout.edge','auth.service.tail.lines','auth.service','auth.tail','auth.tail2','batch-08-internal-auth-boundary'].map(n=>'src/modules/auth/__tests__/'+n+'.test.ts');
const jobs=[
 ['exam-and-report-regressions',['--filter','@quiz/api-server','exec','vitest','run','src/modules/exam-engine/__tests__','src/app/api/generate-report/__tests__/report-auth.test.ts','src/lib/__tests__/current-learner-context.test.ts','src/app/api/auth/me/__tests__/device-session.test.ts','--maxWorkers=1']],
 ['changed-auth-tests-lint',['--filter','@quiz/api-server','exec','eslint','--no-ignore','--max-warnings=0',...tests]],
];
const script=original.slice(0,start)+'const jobs='+JSON.stringify(jobs)+';'+original.slice(end);
fs.writeFileSync(path.join(__dirname,'run-regressions.cjs'),script.replaceAll('QUALITY_RESULTS.json','REGRESSION_RESULTS.json'));
