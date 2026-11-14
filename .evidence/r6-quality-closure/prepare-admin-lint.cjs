const fs=require('fs'),path=require('path');
const original=fs.readFileSync(path.join(__dirname,'run-quality.cjs'),'utf8');
const start=original.indexOf('const jobs=['),end=original.indexOf('\n];',start)+3;
const jobs=[['changed-admin-lint',['--filter','@quiz/skillup-admin','exec','eslint','--no-ignore','--max-warnings=0','src/app/(admin)/audit/page.tsx','src/app/(admin)/batches/[id]/page.tsx','src/app/(admin)/crm/enquiries/[id]/page.tsx','src/app/(admin)/students/[id]/page.tsx','src/app/api/admin/students/invite/redeem/route.ts']]];
const script=original.slice(0,start)+'const jobs='+JSON.stringify(jobs)+';'+original.slice(end);
fs.writeFileSync(path.join(__dirname,'run-admin-lint.cjs'),script.replaceAll('QUALITY_RESULTS.json','ADMIN_TARGETED_LINT_RESULT.json'));
