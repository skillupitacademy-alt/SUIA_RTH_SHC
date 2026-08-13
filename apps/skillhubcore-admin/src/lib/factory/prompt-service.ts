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

export type AssignmentDifficulty = 'simple' | 'mixed' | 'intermediate' | 'expert';

export interface AssignmentPromptBlueprint {
    context: {
        domainName: string;
        subjectName: string;
        topicName: string;
        subtopicName: string;
    };
    difficulty: AssignmentDifficulty;
    tierCounts?: {
        simple: number;
        mixed: number;
        intermediate: number;
        expert: number;
    };
    questionTypesByTier?: Partial<Record<AssignmentDifficulty, string[]>>;
    referenceAnswerGuidance?: string;
}

export interface ContentPromptBlueprint {
    context: {
        domainName: string;
        subjectName: string;
        topicName: string;
        subtopicName: string;
    };
    difficulty: AssignmentDifficulty;
}

export const PromptService = {
    generateTechnicalPrompt: (blueprint: FactoryBlueprint): string => {
        const total = blueprint.counts.simple + blueprint.counts.intermediate + blueprint.counts.expert;
        const sourceSection = blueprint.sourceCode.trim() !== ''
            ? `### SOURCE MATERIAL (THE TRUTH)
Use ONLY the following content to generate the questions. Do not hallucinate facts outside this scope.

The provided code and concepts represent the authoritative knowledge boundary for question generation.

You may generate questions using any permutation, combination, or variation of the concepts contained in this material, including combining multiple concepts into a single question.

Allowed transformations include:

Rearranging code snippets.

Creating logical variations of the given examples.

Embedding the code into conditional or logical scenarios.

Combine multiple concepts into a single question.

Create scenario-based or logic-based questions using these concepts.

Rearrange or slightly modify code examples to test understanding.

${blueprint.sourceCode.trim()}`
            : `### SOURCE MATERIAL
No extra source material was provided.

Generate questions from the selected taxonomy context, difficulty distribution, and official skills only:
- Domain: ${blueprint.context.domainName}
- Subject: ${blueprint.context.subjectName}
- Topic: ${blueprint.context.topicName}
${blueprint.context.subtopicName !== undefined ? `- Subtopic: ${blueprint.context.subtopicName}` : ''}

Do not invent unrelated technologies, topics, or skills outside this selected scope.`;
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
3. 'skillNames': Select the most relevant terms from the provided OFFICIAL TAXONOMY list. If strict mode is ON and taxonomy is available, do not create new skill names.

---

### REQUIREMENT 3: SYNTAX & FORMATTING (CRITICAL)
You must follow these syntax rules EXACTLY to ensure the output is machine-readable:
1. **NO MARKDOWN**: Do not wrap output in markdown code blocks (\`\`\`json). Return raw JSON only.
2. **STRICT ESCAPING**: All internal double quotes inside strings (especially in "codeSnippet" and "explanation") MUST be escaped with a backslash.
   - CORRECT JSON VALUE: "var x = \\u0022hello\\u0022;\\nconsole.log(x);"
   - INCORRECT JSON VALUE: "var x = "hello";\nconsole.log(x);"
3. **VALID JSON ONLY**: Every string must be valid JSON. Do not use unescaped double quotes anywhere inside string values. Do not use single quotes for JSON keys or values.
3. **SINGLE LINE STRINGS**: All values must be single-line strings. Use literal \\n for newlines. Do not use multi-line strings.
4. **NO TRAILING COMMAS**: Verify that no trailing commas exist after the last item in arrays or objects.
5. **FINAL CHECK**: Ensure the output can be parsed by a strict JSON parser without modifications.

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

${sourceSection}
`.trim();
    },

    generateAssignmentPrompt: (blueprint: AssignmentPromptBlueprint): string => {
        const difficultyRules: Record<AssignmentDifficulty, { countRange: string; typeRules: string }> = {
            simple: {
                countRange: '3-5 questions',
                typeRules: 'MCQ only',
            },
            mixed: {
                countRange: '6-10 questions',
                typeRules: 'MCQ + short_answer',
            },
            intermediate: {
                countRange: '8-12 questions',
                typeRules: 'MCQ + short_answer + code',
            },
            expert: {
                countRange: '12-20 questions',
                typeRules: 'all types including open_ended',
            },
        };

        const rules = difficultyRules[blueprint.difficulty];
        const tierCounts = blueprint.tierCounts;
        const questionTypesByTier = blueprint.questionTypesByTier;
        const countSection = tierCounts != null
            ? `
ASSIGNMENT VOLUME:
- Simple: ${tierCounts.simple} questions
- Mixed: ${tierCounts.mixed} questions
- Intermediate: ${tierCounts.intermediate} questions
- Expert: ${tierCounts.expert} questions
- Total: ${tierCounts.simple + tierCounts.mixed + tierCounts.intermediate + tierCounts.expert} questions
`
            : `
QUESTION COUNT:
- Simple: 3-5 questions
- Mixed: 6-10 questions
- Intermediate: 8-12 questions
- Expert: 12-20 questions
`;

        const typeSection = questionTypesByTier != null
            ? `
QUESTION TYPES PER TIER:
- Simple: ${(questionTypesByTier.simple ?? ['mcq']).join(' + ')}
- Mixed: ${(questionTypesByTier.mixed ?? ['mcq', 'short_answer']).join(' + ')}
- Intermediate: ${(questionTypesByTier.intermediate ?? ['mcq', 'short_answer', 'code']).join(' + ')}
- Expert: ${(questionTypesByTier.expert ?? ['mcq', 'short_answer', 'code', 'open_ended']).join(' + ')}
`
            : `
QUESTION TYPES: ${rules.typeRules}
`;

        const referenceAnswerSection = blueprint.referenceAnswerGuidance != null && blueprint.referenceAnswerGuidance.trim() !== ''
            ? `
REFERENCE ANSWER GUIDANCE:
${blueprint.referenceAnswerGuidance.trim()}
`
            : `
REFERENCE ANSWER GUIDANCE:
- Keep reference_answer concise and self-check focused.
- Do not include pass/fail logic.
`;

        return `
ACT AS A SENIOR PRACTICE-ONLY ASSIGNMENT GENERATOR.
Create assignment practice questions for:
${blueprint.context.domainName} > ${blueprint.context.subjectName} > ${blueprint.context.topicName} > ${blueprint.context.subtopicName}

TARGET DIFFICULTY: ${blueprint.difficulty.toUpperCase()}
${countSection}
${typeSection}

IMPORTANT RULES:
- Assignments are practice only. Do not score answers.
- Do not include pass/fail logic.
- Include reference_answer for self-check only.
- Reference answers are shown after the student attempts the assignment.
- Return raw JSON only.
${referenceAnswerSection}

JSON SHAPE REQUIRED:
{
  "assignments": [
    {
      "question_type": "mcq | short_answer | code | open_ended",
      "question": "string",
      "hints": ["string"],
      "reference_answer": "string"
    }
  ]
}

QUESTION WRITING GUIDANCE:
- Make each question practical, specific, and appropriate for the selected difficulty.
- Use hints to support learning without revealing the answer immediately.
- Keep reference_answer concise and self-check focused.

Use only the selected tutorial context. Do not invent unrelated topics.
`.trim();
    },

    generateContentPrompt: (blueprint: ContentPromptBlueprint): string => {
        const difficultyGuidance: Record<AssignmentDifficulty, string> = {
            simple: 'Keep the explanation beginner-friendly, concrete, and short enough for a first pass review.',
            mixed: 'Balance beginner clarity with a little more depth and practical detail.',
            intermediate: 'Go deeper on mechanics, edge cases, and implementation details.',
            expert: 'Aim for architecture-level clarity, nuanced tradeoffs, and careful examples.',
        };

        return `
ACT AS A SENIOR TUTORIAL CONTENT GENERATOR.
Create one canonical tutorial content JSON object for:
${blueprint.context.domainName} > ${blueprint.context.subjectName} > ${blueprint.context.topicName} > ${blueprint.context.subtopicName}

TARGET DIFFICULTY: ${blueprint.difficulty.toUpperCase()}
GUIDANCE: ${difficultyGuidance[blueprint.difficulty]}

OUTPUT RULES:
- Return raw JSON only.
- Follow the content JSON schema exactly.
- Include notes, layman, real_life, technical, code, and ai_tutor blocks.
- Keep ai_tutor.qa_pairs at 3-5 entries.
- If images are included, follow the optional image object structure from the locked schema.
- Do not use Anthropic or OpenAI APIs in this step. This prompt is for external AI copy/paste workflows only.

JSON SHAPE REQUIRED:
{
  "notes": {
    "markdown": "string",
    "image": {
      "type": "svg_standard | r2_custom",
      "svgKey": "string | null",
      "url": "string | null",
      "alt": "string",
      "caption": "string | null",
      "position": "right | bottom | inline",
      "width": 200
    }
  },
  "layman": {
    "simpleExplanation": "string",
    "analogyOrStory": "string",
    "example1": { "company": "string", "content": "string" },
    "example2": { "company": "string", "content": "string" },
    "image": { "type": "svg_standard | r2_custom", "svgKey": "string | null", "url": "string | null", "alt": "string", "caption": "string | null", "position": "right | bottom | inline", "width": 200 }
  },
  "real_life": {
    "title": "string",
    "scenario": "string",
    "bullets": [{ "label": "string", "detail": "string" }],
    "tip": "string",
    "image": { "type": "svg_standard | r2_custom", "svgKey": "string | null", "url": "string | null", "alt": "string", "caption": "string | null", "position": "right | bottom | inline", "width": 200 }
  },
  "technical": {
    "markdown": "string",
    "bullets": [{ "term": "string", "detail": "string" }],
    "tip": "string",
    "image": { "type": "svg_standard | r2_custom", "svgKey": "string | null", "url": "string | null", "alt": "string", "caption": "string | null", "position": "right | bottom | inline", "width": 200 }
  },
  "code": {
    "language": "javascript | typescript | python | sql | scala | java | bash",
    "intro": "string",
    "code": "string",
    "steps": ["string"],
    "image": { "type": "svg_standard | r2_custom", "svgKey": "string | null", "url": "string | null", "alt": "string", "caption": "string | null", "position": "right | bottom | inline", "width": 200 }
  },
  "ai_tutor": {
    "greeting": "string",
    "qa_pairs": [{ "question": "string", "answer": "string" }]
  }
}

QUALITY CHECKS:
- notes markdown should be substantial and precise.
- layman explanation should avoid jargon and explain with a relatable example.
- real_life must connect the idea to a concrete workflow.
- technical must be precise and define the main terms.
- code should be minimal but runnable or clearly executable.
- ai_tutor answers should reinforce the same concept in plain language.

Use the selected context only.
`.trim();
    }
};

export const TutorialPromptService = PromptService;
