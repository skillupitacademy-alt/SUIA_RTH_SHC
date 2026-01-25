
import { db, questions } from './src';
import { exams, examQuestions } from './src/schema/exam'; 
import { eq } from 'drizzle-orm';

const examId = '8b99732e-884e-4403-864e-0017d105990e';

async function main() {
  console.log(`Checking Exam: ${examId}`);
  
  const exam = await db.query.exams.findFirst({
    where: eq(exams.id, examId),
    with: {
      examQuestions: {
        with: {
          question: true, 
        }
      }
    }
  });

  if (!exam) {
    console.log('Exam NOT FOUND');
    return;
  }

  console.log(`Exam Found: Status=${exam.status}`);
  console.log(`Question Count: ${exam.examQuestions.length}`);
  
  if (exam.examQuestions.length > 0) {
    console.log('Sample Question 1:', JSON.stringify(exam.examQuestions[0], null, 2));
  } else {
    // Check raw count in case relation query failed
    const rawCount = await db.select().from(examQuestions).where(eq(examQuestions.examId, examId));
    console.log(`Raw ExamQuestions Count: ${rawCount.length}`);
  }
}

main().catch(console.error).then(() => process.exit(0));
