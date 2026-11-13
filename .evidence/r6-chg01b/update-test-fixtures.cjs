const fs = require('node:fs');
const files = [
  'apps/skillup-web/src/app/api/tutorial/progress/route.test.ts',
  'apps/skillup-web/src/app/api/tutorial/ils/block-completion/route.test.ts',
  'apps/skillup-web/src/app/api/tutorial/ils/navigation/[nodeId]/__tests__/boundary.test.ts',
  'apps/skillup-web/src/app/api/tutorial/ils/subtopic/[subtopicId]/progress/__tests__/boundary.test.ts',
];
for (const file of files) {
  let source = fs.readFileSync(file, 'utf8');
  source = source.replaceAll("userId: 'learner'", "learnerUserId: '11111111-1111-4111-8111-111111111111', peoplePersonId: '22222222-2222-4222-8222-222222222222'")
    .replaceAll("userId: 'synthetic-learner'", "learnerUserId: '11111111-1111-4111-8111-111111111111', peoplePersonId: '22222222-2222-4222-8222-222222222222'")
    .replaceAll("userId: 'fixture'", "learnerUserId: '11111111-1111-4111-8111-111111111111', peoplePersonId: '22222222-2222-4222-8222-222222222222'")
    .replaceAll("userId: 'fixture-user'", "learnerUserId: '11111111-1111-4111-8111-111111111111', peoplePersonId: '22222222-2222-4222-8222-222222222222'");
  fs.writeFileSync(file, source);
}
// These shared route suites incidentally contain held cases. Only the common
// mocked authentication shape changes. No held endpoint/test logic is edited.
for (const file of [
  'apps/skillup-web/src/app/api/__tests__/routes.test.ts',
  'apps/skillup-web/src/app/api/student/__tests__/private-cache.test.ts',
]) {
  const source = fs.readFileSync(file, 'utf8');
  const updated = file.includes('private-cache')
    ? source.replace("ok: true, userId: 'fixture'", "ok: true, userId: 'fixture', learnerUserId: '11111111-1111-4111-8111-111111111111', peoplePersonId: 'fixture'")
    : source.replace("userId: 'student-1',\n      payload:", "userId: 'student-1',\n      learnerUserId: '11111111-1111-4111-8111-111111111111',\n      peoplePersonId: 'student-1',\n      payload:");
  fs.writeFileSync(file, updated);
}
