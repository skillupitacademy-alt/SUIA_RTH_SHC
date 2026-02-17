/* eslint-disable no-useless-escape */
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
    knownSkills?: string[];
    strictMode?: boolean;
}

export const PromptService = {
    generateTechnicalPrompt: (blueprint: FactoryBlueprint): string => {
        const total = blueprint.counts.simple + blueprint.counts.intermediate + blueprint.counts.expert;
        const skillsList = (blueprint.knownSkills?.length ?? 0) > 0 
            ? `\n### OFFICIAL TAXONOMY (PRIORITY)\nYou MUST prioritize using these existing skills for the 'skillNames' array:\n${blueprint.knownSkills!.map(s => `- ${s}`).join('\n')}\n\n${blueprint.strictMode === true 
                ? "*CRITICAL RULE: You are FORBIDDEN from creating new skill names. You MUST map every question to at least one skill from the list above.*" 
                : "*Rule: Only create a new skill name if the concept is absolutely not covered by the list above.*"}`
            : '';
        
        return `
ACT AS A SENIOR TECHNICAL EXAMINER.
Your task is to generate exactly ${total} multiple-choice questions for the following context:
Context: ${blueprint.context.domainName} > ${blueprint.context.subjectName} > ${blueprint.context.topicName}${blueprint.context.subtopicName !== undefined ? ` > ${blueprint.context.subtopicName}` : ''}
${skillsList}

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
3. 'skillNames': Select the most relevant technical terms from the provided ### OFFICIAL TAXONOMY list. You may only extract from source code if the taxonomy is empty or if Strict Mode is OFF.

---

### REQUIREMENT 3: SYNTAX & FORMATTING (CRITICAL)
You must follow these syntax rules EXACTLY to ensure the output is machine-readable:
1. **NO MARKDOWN**: Do not wrap output in markdown code blocks (\`\`\`json). Return raw JSON only.
2. **STRICT ESCAPING**: All internal double quotes inside strings (especially in "codeSnippet" and "explanation") MUST be escaped with a backslash.
   - CORRECT: "var x = \"hello\";"
   - INCORRECT: "var x = "hello";"
3. **SINGLE LINE STRINGS**: All values must be single-line strings. Use literal \\n for newlines. Do not use multi-line strings.
4. **NO TRAILING COMMAS**: Verify that no trailing commas exist after the last item in arrays or objects.

---

### REQUIREMENT 4: JSON SCHEMA
You must return ONLY a raw JSON object matching this schema:

{
  "questions": [
    {
      "questionText": "The actual question string?",
      "codeSnippet": "Optional code block content (using \\n for line breaks)",
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
