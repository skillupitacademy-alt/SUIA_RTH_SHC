export interface FactoryBlueprint {
    sourceCode: string;
    counts: {
        simple: number;
        intermediate: number;
        expert: number;
    };
    context: {
        domainName: string;
        subjectName: string;
        topicName: string;
        subtopicName?: string;
    };
}

export const PromptService = {
    generateTechnicalPrompt: (blueprint: FactoryBlueprint): string => {
        const total = blueprint.counts.simple + blueprint.counts.intermediate + blueprint.counts.expert;
        
        return `
ACT AS A SENIOR TECHNICAL EXAMINER.
Your task is to generate exactly ${total} multiple-choice questions for the following context:
Context: ${blueprint.context.domainName} > ${blueprint.context.subjectName} > ${blueprint.context.topicName}${blueprint.context.subtopicName ? ` > ${blueprint.context.subtopicName}` : ''}

---

### REQUIREMENT 1: STRICT DISTRIBUTION
You MUST generate the questions with this exact difficulty breakdown:
- ${blueprint.counts.simple} questions MUST be 'simple' (Foundational/Recall).
- ${blueprint.counts.intermediate} questions MUST be 'intermediate' (Application/Logic).
- ${blueprint.counts.expert} questions MUST be 'expert' (Architecture/Complex Scenarios).

---

### REQUIREMENT 2: METADATA CALCULATION
For each question, you must calculate and include:
1. 'depthLevel' (Integer 1-10): Rate the complexity (1=Syntax, 5=Pattern, 10=Architecture).
2. 'mappingType': Label as 'conceptual' (Theory), 'technical' (Syntax), or 'practical' (Real-world).
3. 'skillNames': Extract specific technical terms from the source code (e.g., 'React Hooks', 'State Management') as an array of strings.

---

### REQUIREMENT 3: JSON SCHEMA (CRITICAL)
You must return ONLY a raw JSON object. Do not wrap it in markdown block quotes.
The output must match this schema EXACTLY:

{
  "questions": [
    {
      "questionText": "The actual question string?",
      "codeSnippet": "Optional code block content if needed (e.g. function body)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact string matching one of the options",
      "explanation": "Detailed rationale explaining why the answer is correct.",
      "difficulty": "simple|intermediate|expert",
      "depthLevel": 1,
      "mappingType": "conceptual|technical|practical",
      "skillNames": ["SkillA", "SkillB"]
    }
  ]
}

---

### SOURCE MATERIAL (THE TRUTH)
Use ONLY the following content to generate the questions. Do not hallucinate facts outside this scope.

${blueprint.sourceCode}
`.trim();
    }
};
