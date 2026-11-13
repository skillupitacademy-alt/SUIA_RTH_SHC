const fs=require('fs');
const path=require('path');
const base=__dirname;
const d=JSON.parse(fs.readFileSync(path.join(base,'current-method-inventory.json'),'utf8'));
const receipt='authenticated-http-ownership-final.json';
for(const row of d.rows){
 if(row.scope==='OWNER HOLD') continue;
 if(['/api/profile','/api/auth/sessions','/api/auth/sessions/[sessionId]','/api/tutorial/progress'].includes(row.route)&&row.app!=='skillhubcore-admin'){
  row.authority=row.route==='/api/profile'?'Shared bffProfileHandler -> requireBffAuth -> API getAuthContext -> OwnershipRBACService':row.route.includes('/auth/sessions')?'proxyAuthRequest -> API current account/device binding -> owner-qualified TokenRepository':'Brand student guard -> API authenticateLearnerRequest -> TutorialProgressRepository';
  row.upstream=row.route==='/api/profile'?'apps/api-server/src/app/api/auth/profile/route.ts':row.route.includes('/auth/sessions')?'apps/api-server/src/app/api/auth/sessions + modules/auth/repositories/token.repository.ts':'apps/api-server/src/app/api/tutorial/progress/route.ts';
  row.membership_ownership=row.route==='/api/profile'?'Current signed brand/local user; backend uses authenticated userId and allowlisted mutable fields':row.route.includes('/auth/sessions')?'Persisted same-device pair; session query/revoke includes authenticated owner':'Repository uses authenticated local userId + verified tenant; client userId cannot choose owner';
  row.positive_evidence=row.method==='GET'||row.route==='/api/profile'?receipt+'; matching own-resource positive':'R4 gateway-device-binding-results.json; no fresh mutation positive for this row';
  row.negative_evidence=receipt+'; cross-user profile/header/ownership, foreign device DELETE, wrong-brand cookie pair, hostile-origin PATCH; apply only matching scenario';
  row.cache_policy='Actual HTTP private,no-store on tested reads; untested statuses remain pending';
  row.status='PARTIAL';row.gap='Bounded authenticated scenarios verified. Remaining supported-method, malformed-object, entitlement and outage cases require row-specific evidence.';
 }
 if(row.app==='realtutorialhub-web'&&['/api/tutorial/projects/submissions','/api/tutorial/sessions/my-requests'].includes(row.route)){
  row.authority='Common current-session proxy -> requireStudent -> existing owner-scoped service/repository';
  row.positive_evidence=receipt+'; genuine synthetic learner HTTP200, private/no-store';
  row.negative_evidence='Common R4 current-session/device evidence and R5 proxy unit anonymous denial; per-record negatives still pending';
  row.cache_policy='Actual HTTP private,no-store';row.status='PARTIAL';row.gap='Empty-own-list positive verified. Populated foreign-object/entitlement fixtures still pending.';
 }
 if(row.route==='/api/auth/test-fixture-session'){
  row.classification='TEST FIXTURE ONLY'; row.authority='Environment production deny -> timing-safe secret -> configured tenant/fixture allowlist';row.status='PARTIAL';row.gap='Existing targeted production-gate tests included in SUIA suite. No deployed production configuration claim.';
 }
 if(row.app==='skillhubcore-admin'&&row.classification==='PRIVATE'){
  row.negative_evidence='R5 shc-security.log (65 mocked boundary/transport tests) and shc-boundaries.log (80 static checks); R4 anonymous matrix. Per-handler runtime auth scope still pending.';
 }
 if(row.route==='/api/quiz/result'&&row.app!=='skillhubcore-admin'){
  row.authority='Existing BFF proxyUpstreamRequest -> local backend quiz/result -> verified user token -> MainDB exam owner check';
  row.upstream='apps/api-server/src/app/api/quiz/result/route.ts';
  row.membership_ownership='Current browser device/brand boundary plus exam.userId equals verified payload.userId';
  row.positive_evidence='authenticated-http-exam-final-results.json; own started exam HTTP202';
  row.negative_evidence='authenticated-http-exam-final-results.json; foreign exam and forged owner headers HTTP403';
  row.status='PARTIAL';row.gap='Started-exam owner boundary verified. Completed reports/scoring and cross-brand colliding identity semantics remain pending. Remote MainDB user tenant columns are absent.';
 }
 if(row.classification==='SIGNED WORKER'){
  row.authority='Existing signed worker boundary; independent service authentication';row.gap='Signature and authoritative-event/object checks need route-specific evidence. Learner cookie guards are inapplicable.';
 }
 if(row.classification==='RETIRED'){row.status='N/A';row.gap='Existing handler returns410 or retired tutorial content response; no authoring/learner journey executed.';}
}
const columns=Object.keys(d.rows[0]);const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';
fs.writeFileSync(path.join(base,'AUTHENTICATED_AUTHORIZATION_MATRIX.csv'),[columns.join(','),...d.rows.map(row=>columns.map(c=>q(row[c])).join(','))].join('\r\n')+'\r\n');
fs.writeFileSync(path.join(base,'current-method-inventory.json'),JSON.stringify(d,null,2));
console.log(JSON.stringify({methods:d.rows.length,statuses:d.rows.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{})}));
