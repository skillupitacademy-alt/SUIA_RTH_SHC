const fs = require('node:fs');
const path = require('node:path');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const changed = [];
for (const file of walk('apps/skillup-web/src/app/api/tutorial').filter(file => file.endsWith('route.ts'))) {
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes('requireStudentAuth')) continue;
  const updated = source.replaceAll('requireStudentAuth(request)', "requireStudentAuth(request, { identity: 'learner' })")
    .replaceAll('authResult.userId', 'authResult.learnerUserId')
    .replaceAll('authResult.payload.userId', 'authResult.learnerUserId');
  fs.writeFileSync(file, updated);
  changed.push(file);
}
for (const route of ['student/dashboard', 'student/my-batch', 'student/placement', 'batches']) {
  const file = `apps/skillup-web/src/app/api/${route}/route.ts`;
  const source = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, source.replace('requireStudentAuth(request)', "requireStudentAuth(request, { identity: 'people' })")
    .replaceAll('auth.userId', 'auth.peoplePersonId'));
  changed.push(file);
}
for (const route of ['programs', 'programs/[slug]', 'faculty']) {
  const file = `apps/skillup-web/src/app/api/${route}/route.ts`;
  const source = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, source.replaceAll('requireStudentAuth(effectiveReq)', "requireStudentAuth(effectiveReq, { identity: 'learner' })")
    .replaceAll('requireStudentAuth(request)', "requireStudentAuth(request, { identity: 'learner' })")
    .replaceAll('studentAuth.userId', 'studentAuth.learnerUserId'));
  changed.push(file);
}
console.log(changed.join('\n'));
