-- Query 1: Exam Questions State
SELECT 
    eq.id, 
    eq.question_id, 
    eq.user_answer, 
    eq.is_correct
FROM exam_questions eq
WHERE eq.exam_id = '47466244-f757-465b-965e-38e93e4fcdbe'
ORDER BY eq."order"
LIMIT 10;

-- Query 2: Exam Header
SELECT 
    id,
    status,
    total_score,
    started_at,
    completed_at
FROM exams
WHERE id = '47466244-f757-465b-965e-38e93e4fcdbe';

-- Query 3: Analysis Counts
SELECT 
    COUNT(*) as total_questions,
    COUNT(CASE WHEN user_answer IS NULL THEN 1 END) as null_answers,
    COUNT(CASE WHEN is_correct IS NULL THEN 1 END) as null_correct,
    COUNT(CASE WHEN is_correct = false THEN 1 END) as false_correct,
    COUNT(CASE WHEN is_correct = true THEN 1 END) as true_correct
FROM exam_questions
WHERE exam_id = '47466244-f757-465b-965e-38e93e4fcdbe';
