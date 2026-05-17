export const getQuizPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the QUIZ SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section tests the learner's understanding with various question types.

Output in this EXACT JSON format with 20 total questions:

{
  "quiz": {
    "quizOverview": {
      "title": "${subtopicName} - Knowledge Check",
      "description": "[What this quiz tests, 2 sentences]",
      "totalQuestions": 20,
      "passingScore": 70,
      "timeLimit": "20 minutes",
      "xpReward": 150
    },
    "multipleChoice": {
      "title": "Multiple Choice Questions",
      "questions": [
        {
          "id": "mc1",
          "question": "[Question 1]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Why this is correct, 2 sentences]",
          "difficulty": "easy"
        },
        {
          "id": "mc2",
          "question": "[Question 2]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Why this is correct, 2 sentences]",
          "difficulty": "medium"
        },
        {
          "id": "mc3",
          "question": "[Question 3]",
          "options": [
            { "id": "a", "text": "[Option A]" },
            { "id": "b", "text": "[Option B]" },
            { "id": "c", "text": "[Option C]" },
            { "id": "d", "text": "[Option D]" }
          ],
          "correctAnswer": "c",
          "explanation": "[Why this is correct, 2 sentences]",
          "difficulty": "hard"
        }
      ]
    },
    "trueFalse": {
      "title": "True or False",
      "questions": [
        {
          "id": "tf1",
          "statement": "[Statement 1]",
          "correctAnswer": true,
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "easy"
        },
        {
          "id": "tf2",
          "statement": "[Statement 2]",
          "correctAnswer": false,
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "medium"
        },
        {
          "id": "tf3",
          "statement": "[Statement 3]",
          "correctAnswer": true,
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "medium"
        }
      ]
    },
    "codeOutput": {
      "title": "What's the Output?",
      "questions": [
        {
          "id": "co1",
          "code": "[Code snippet with \\\\n for newlines]",
          "question": "What will this code output?",
          "options": [
            { "id": "a", "text": "[Output A]" },
            { "id": "b", "text": "[Output B]" },
            { "id": "c", "text": "[Output C]" },
            { "id": "d", "text": "[Output D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Why this is the output, 2-3 sentences]",
          "difficulty": "medium"
        },
        {
          "id": "co2",
          "code": "[Code snippet with \\\\n for newlines]",
          "question": "What will this code output?",
          "options": [
            { "id": "a", "text": "[Output A]" },
            { "id": "b", "text": "[Output B]" },
            { "id": "c", "text": "[Output C]" },
            { "id": "d", "text": "[Output D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Why this is the output, 2-3 sentences]",
          "difficulty": "hard"
        },
        {
          "id": "co3",
          "code": "[Code snippet with \\\\n for newlines]",
          "question": "What will this code output?",
          "options": [
            { "id": "a", "text": "[Output A]" },
            { "id": "b", "text": "[Output B]" },
            { "id": "c", "text": "[Output C]" },
            { "id": "d", "text": "[Output D]" }
          ],
          "correctAnswer": "c",
          "explanation": "[Why this is the output, 2-3 sentences]",
          "difficulty": "hard"
        }
      ]
    },
    "fillInBlank": {
      "title": "Fill in the Blanks",
      "questions": [
        {
          "id": "fb1",
          "question": "[Question with _____ blank]",
          "correctAnswer": "[Correct answer]",
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "easy"
        },
        {
          "id": "fb2",
          "question": "[Question with _____ blank]",
          "correctAnswer": "[Correct answer]",
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "medium"
        },
        {
          "id": "fb3",
          "question": "[Question with _____ blank]",
          "correctAnswer": "[Correct answer]",
          "explanation": "[Explanation, 2 sentences]",
          "difficulty": "medium"
        }
      ]
    },
    "codeDebugging": {
      "title": "Debug the Code",
      "questions": [
        {
          "id": "db1",
          "code": "[Buggy code with \\\\n for newlines]",
          "question": "What's wrong with this code?",
          "options": [
            { "id": "a", "text": "[Bug A]" },
            { "id": "b", "text": "[Bug B]" },
            { "id": "c", "text": "[Bug C]" },
            { "id": "d", "text": "[Bug D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Explanation of the bug and fix, 2-3 sentences]",
          "fixedCode": "[Fixed code with \\\\n for newlines]",
          "difficulty": "medium"
        },
        {
          "id": "db2",
          "code": "[Buggy code with \\\\n for newlines]",
          "question": "What's wrong with this code?",
          "options": [
            { "id": "a", "text": "[Bug A]" },
            { "id": "b", "text": "[Bug B]" },
            { "id": "c", "text": "[Bug C]" },
            { "id": "d", "text": "[Bug D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Explanation of the bug and fix, 2-3 sentences]",
          "fixedCode": "[Fixed code with \\\\n for newlines]",
          "difficulty": "hard"
        },
        {
          "id": "db3",
          "code": "[Buggy code with \\\\n for newlines]",
          "question": "What's wrong with this code?",
          "options": [
            { "id": "a", "text": "[Bug A]" },
            { "id": "b", "text": "[Bug B]" },
            { "id": "c", "text": "[Bug C]" },
            { "id": "d", "text": "[Bug D]" }
          ],
          "correctAnswer": "c",
          "explanation": "[Explanation of the bug and fix, 2-3 sentences]",
          "fixedCode": "[Fixed code with \\\\n for newlines]",
          "difficulty": "hard"
        }
      ]
    },
    "scenarioBased": {
      "title": "Scenario-Based Questions",
      "questions": [
        {
          "id": "sb1",
          "scenario": "[Real-world scenario, 2-3 sentences]",
          "question": "[Question about the scenario]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "a",
          "explanation": "[Why this is the best solution, 2-3 sentences]",
          "difficulty": "medium"
        },
        {
          "id": "sb2",
          "scenario": "[Real-world scenario, 2-3 sentences]",
          "question": "[Question about the scenario]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "b",
          "explanation": "[Why this is the best solution, 2-3 sentences]",
          "difficulty": "hard"
        },
        {
          "id": "sb3",
          "scenario": "[Real-world scenario, 2-3 sentences]",
          "question": "[Question about the scenario]",
          "options": [
            { "id": "a", "text": "[Solution A]" },
            { "id": "b", "text": "[Solution B]" },
            { "id": "c", "text": "[Solution C]" },
            { "id": "d", "text": "[Solution D]" }
          ],
          "correctAnswer": "c",
          "explanation": "[Why this is the best solution, 2-3 sentences]",
          "difficulty": "hard"
        }
      ]
    },
    "quizResults": {
      "title": "Quiz Results",
      "scoreRanges": [
        {
          "range": "90-100%",
          "message": "[Excellent message]",
          "badge": "Quiz Master",
          "nextSteps": "[What to do next]"
        },
        {
          "range": "70-89%",
          "message": "[Good message]",
          "badge": "Quiz Passed",
          "nextSteps": "[What to do next]"
        },
        {
          "range": "50-69%",
          "message": "[Needs improvement message]",
          "badge": "Keep Trying",
          "nextSteps": "[What to review]"
        },
        {
          "range": "0-49%",
          "message": "[Encouraging message]",
          "badge": "Review Needed",
          "nextSteps": "[What to study]"
        }
      ]
    }
  }
}

**IMPORTANT**: 
- Create 20 total questions (3 MC, 3 TF, 3 Code Output, 3 Fill Blank, 3 Debug, 3 Scenario, 2 Results)
- Mix difficulty: easy (30%), medium (40%), hard (30%)
- Test understanding, not just memorization`;
