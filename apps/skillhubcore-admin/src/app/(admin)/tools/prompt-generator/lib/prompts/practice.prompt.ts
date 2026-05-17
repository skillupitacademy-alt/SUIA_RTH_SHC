export const getPracticePrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the PRACTICE TEST SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section provides a comprehensive practice test similar to real exams.

Output in this EXACT JSON format with 30 total questions:

{
  "practiceTest": {
    "testOverview": {
      "title": "${subtopicName} - Comprehensive Practice Test",
      "description": "[What this test covers, 2-3 sentences]",
      "totalQuestions": 30,
      "passingScore": 75,
      "timeLimit": "45 minutes",
      "xpReward": 300,
      "difficulty": "mixed"
    },
    "theoryQuestions": {
      "title": "Theory Questions",
      "questions": [
        {
          "id": "theory1",
          "question": "[Conceptual question]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Detailed explanation, 3-4 sentences]",
          "difficulty": "easy",
          "points": 5
        },
        {
          "id": "theory2",
          "question": "[Conceptual question]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Detailed explanation, 3-4 sentences]",
          "difficulty": "medium",
          "points": 5
        },
        {
          "id": "theory3",
          "question": "[Conceptual question]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "c",
          "explanation": "[Detailed explanation, 3-4 sentences]",
          "difficulty": "hard",
          "points": 5
        }
      ]
    },
    "practicalQuestions": {
      "title": "Practical Application Questions",
      "questions": [
        {
          "id": "prac1",
          "scenario": "[Real-world scenario, 2-3 sentences]",
          "question": "[Question about implementation]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Why this is best, 3-4 sentences]",
          "difficulty": "medium",
          "points": 10
        },
        {
          "id": "prac2",
          "scenario": "[Real-world scenario, 2-3 sentences]",
          "question": "[Question about implementation]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Why this is best, 3-4 sentences]",
          "difficulty": "hard",
          "points": 10
        }
      ]
    },
    "codeAnalysisQuestions": {
      "title": "Code Analysis Questions",
      "questions": [
        {
          "id": "analysis1",
          "code": "[Complex code snippet with \\\\n for newlines]",
          "question": "[Question about the code]",
          "options": [
            { "id": "a", "text": "[Answer A]" },
            { "id": "b", "text": "[Answer B]" },
            { "id": "c", "text": "[Answer C]" },
            { "id": "d", "text": "[Answer D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Detailed code analysis, 3-4 sentences]",
          "difficulty": "medium",
          "points": 10
        },
        {
          "id": "analysis2",
          "code": "[Complex code snippet with \\\\n for newlines]",
          "question": "[Question about the code]",
          "options": [
            { "id": "a", "text": "[Answer A]" },
            { "id": "b", "text": "[Answer B]" },
            { "id": "c", "text": "[Answer C]" },
            { "id": "d", "text": "[Answer D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Detailed code analysis, 3-4 sentences]",
          "difficulty": "hard",
          "points": 10
        }
      ]
    },
    "debuggingQuestions": {
      "title": "Debugging Questions",
      "questions": [
        {
          "id": "debug1",
          "code": "[Buggy code with \\\\n for newlines]",
          "question": "Identify and fix the bug",
          "options": [
            { "id": "a", "text": "[Fix A]" },
            { "id": "b", "text": "[Fix B]" },
            { "id": "c", "text": "[Fix C]" },
            { "id": "d", "text": "[Fix D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Bug explanation and fix, 3-4 sentences]",
          "fixedCode": "[Corrected code with \\\\n for newlines]",
          "difficulty": "hard",
          "points": 15
        },
        {
          "id": "debug2",
          "code": "[Buggy code with \\\\n for newlines]",
          "question": "Identify and fix the bug",
          "options": [
            { "id": "a", "text": "[Fix A]" },
            { "id": "b", "text": "[Fix B]" },
            { "id": "c", "text": "[Fix C]" },
            { "id": "d", "text": "[Fix D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Bug explanation and fix, 3-4 sentences]",
          "fixedCode": "[Corrected code with \\\\n for newlines]",
          "difficulty": "medium",
          "points": 15
        }
      ]
    },
    "bestPracticeQuestions": {
      "title": "Best Practice Questions",
      "questions": [
        {
          "id": "bp1",
          "scenario": "[Code scenario, 2 sentences]",
          "question": "What's the best practice approach?",
          "options": [
            { "id": "a", "text": "[Approach A]" },
            { "id": "b", "text": "[Approach B]" },
            { "id": "c", "text": "[Approach C]" },
            { "id": "d", "text": "[Approach D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Why this is best practice, 3-4 sentences]",
          "difficulty": "medium",
          "points": 10
        },
        {
          "id": "bp2",
          "scenario": "[Code scenario, 2 sentences]",
          "question": "What's the best practice approach?",
          "options": [
            { "id": "a", "text": "[Approach A]" },
            { "id": "b", "text": "[Approach B]" },
            { "id": "c", "text": "[Approach C]" },
            { "id": "d", "text": "[Approach D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Why this is best practice, 3-4 sentences]",
          "difficulty": "hard",
          "points": 10
        }
      ]
    },
    "performanceQuestions": {
      "title": "Performance Optimization Questions",
      "questions": [
        {
          "id": "perf1",
          "scenario": "[Performance scenario, 2-3 sentences]",
          "question": "How would you optimize this?",
          "options": [
            { "id": "a", "text": "[Optimization A]" },
            { "id": "b", "text": "[Optimization B]" },
            { "id": "c", "text": "[Optimization C]" },
            { "id": "d", "text": "[Optimization D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Performance analysis, 3-4 sentences]",
          "difficulty": "hard",
          "points": 15
        }
      ]
    },
    "comprehensiveScenarios": {
      "title": "Comprehensive Scenarios",
      "questions": [
        {
          "id": "comp1",
          "scenario": "[Complex real-world scenario, 3-4 sentences]",
          "question": "[Multi-part question]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Comprehensive explanation, 4-5 sentences]",
          "difficulty": "hard",
          "points": 20
        },
        {
          "id": "comp2",
          "scenario": "[Complex real-world scenario, 3-4 sentences]",
          "question": "[Multi-part question]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Comprehensive explanation, 4-5 sentences]",
          "difficulty": "hard",
          "points": 20
        }
      ]
    },
    "testResults": {
      "title": "Test Results and Feedback",
      "scoreRanges": [
        {
          "range": "90-100%",
          "grade": "A",
          "message": "[Excellent performance message]",
          "badge": "Test Master",
          "feedback": "[Specific feedback]",
          "nextSteps": "[What to do next]"
        },
        {
          "range": "75-89%",
          "grade": "B",
          "message": "[Good performance message]",
          "badge": "Test Passed",
          "feedback": "[Specific feedback]",
          "nextSteps": "[What to improve]"
        },
        {
          "range": "60-74%",
          "grade": "C",
          "message": "[Needs improvement message]",
          "badge": "Keep Practicing",
          "feedback": "[Specific feedback]",
          "nextSteps": "[What to review]"
        },
        {
          "range": "0-59%",
          "grade": "F",
          "message": "[Encouraging message]",
          "badge": "Review Required",
          "feedback": "[Specific feedback]",
          "nextSteps": "[What to study]"
        }
      ]
    }
  }
}

**IMPORTANT**: 
- Create 30 total questions: 3 theory (easy/med/hard), 2 practical (med/hard), 2 code analysis (med/hard), 2 debugging (hard/med), 2 best practice (med/hard), 1 performance (hard), 2 comprehensive (hard/hard)
- Mix difficulty: easy (30%), medium (40%), hard (30%)
- Points: easy=5, medium=10, hard=15-20`;
