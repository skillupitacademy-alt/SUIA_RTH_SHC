const examId = '47466244-f757-465b-965e-38e93e4fcdbe';

async function queryExam() {
  const { db } = await import('@quiz/db');
  const { eq } = await import('drizzle-orm');
  
  console.log('\n=== QUERY 1: Exam Questions State ===\n');
  
  const questions = await db.query.examQuestions.findMany({
    where: (examQuestions, { eq }) => eq(examQuestions.examId, examId),
    columns: {
      id: true,
      questionId: true,
      userAnswer: true,
      isCorrect: true,
    },
    limit: 10,
  });
  
  console.table(questions);
  
  console.log('\n=== QUERY 2: Exam Header ===\n');
  
  const exam = await db.query.exams.findFirst({
    where: (exams, { eq }) => eq(exams.id, examId),
    columns: {
      id: true,
      status: true,
      totalScore: true,
      startedAt: true,
      completedAt: true,
    },
  });
  
  console.table([exam]);
  
  console.log('\n=== ANALYSIS ===\n');
  
  const nullAnswers = questions.filter(q => !q.userAnswer).length;
  const nullCorrect = questions.filter(q => q.isCorrect === null).length;
  const falseCorrect = questions.filter(q => q.isCorrect === false).length;
  const trueCorrect = questions.filter(q => q.isCorrect === true).length;
  
  console.log(`Total questions: ${questions.length}`);
  console.log(`user_answer is NULL: ${nullAnswers}`);
  console.log(`is_correct is NULL: ${nullCorrect}`);
  console.log(`is_correct is FALSE: ${falseCorrect}`);
  console.log(`is_correct is TRUE: ${trueCorrect}`);
  
  if (nullAnswers === questions.length) {
    console.log('\n🔴 ROOT CAUSE: submitAnswer() never saved answers to DB');
  } else if (nullCorrect === questions.length) {
    console.log('\n🔴 ROOT CAUSE: completeExam() overwrote is_correct with NULL (Bug #1)');
  } else if (falseCorrect === questions.length) {
    console.log('\n🔴 ROOT CAUSE: Answer format mismatch in scoring (Bug #2)');
  } else if (trueCorrect > 0) {
    console.log('\n✅ Some answers ARE correct - check if frontend is showing them correctly');
  }
  
  process.exit(0);
}

queryExam().catch(console.error);
