import { db } from '@quiz/database';

async function main() {
  console.log('Deleting layman section for whatisjavascript...');
  const result = await db.tutorialSection.deleteMany({
    where: {
      subtopicId: 'whatisjavascript',
      sectionType: 'layman',
    },
  });
  console.log('Deleted records:', result.count);
}

main()
  .catch(e => console.error(e));
