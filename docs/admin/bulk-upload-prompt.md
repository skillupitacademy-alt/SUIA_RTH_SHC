# AI Prompt: Question Generation for Bulk Upload

Use the following prompt with any LLM (ChatGPT, Claude, Gemini) to generate questions that are 100% compatible with the Quiz Platform's Bulk Upload system.

## The Prompt
```text
Please generate high-quality quiz questions for the topic '[INSERT_TOPIC_HERE]'. 

**Format requirements:** Output the result as a raw JSON array. Do not include any explanatory text outside the JSON.

**Schema per question:**
- "text": (string) Question in Markdown format.
- "type": (string) 'single' or 'multiple'.
- "difficulty": (string) 'simple', 'intermediate', or 'expert'.
- "options": (array) 4 options, each with "text" (string) and "isCorrect" (boolean).
- "explanation": (string) Why the answer is right.
- "estimatedTime": (int) Seconds (e.g., 60).
- "tags": (array of strings).

**Constraints:**
- 'single' type must have exactly 1 correct answer.
- 'multiple' type must have 2+ correct answers.
```

## JSON Structure Reference
The platform expects an array like this:
```json
[
  {
    "text": "What is 2 + 2?",
    "type": "single",
    "difficulty": "simple",
    "options": [
      { "text": "4", "isCorrect": true },
      { "text": "5", "isCorrect": false }
    ],
    "explanation": "2 plus 2 is mathematically equivalent to 4.",
    "estimatedTime": 30,
    "tags": ["math", "basics"]
  }
]
```
