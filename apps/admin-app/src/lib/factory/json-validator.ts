import { GeneratedQuestion, ValidationResult } from '../../types/factory';

export const JsonValidator = {
    /**
     * Attempts to heal common JSON syntax errors from AI
     */
    repairJson: (raw: string): string => {
        let healed = raw.trim();

        // 1. Remove trailing commas before closing braces/brackets
        healed = healed.replace(/,\s*([\]}])/g, '$1');

        // 2. Fix unquoted keys (basic version for common technical keys)
        // This targets alphanumeric keys that aren't wrapped in quotes
        healed = healed.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

        // 3. Convert single quotes to double quotes for keys/values
        // This is tricky but we target common patterns
        // Replace single quotes that start or end a string (near :, {, [, ,, ], })
        healed = healed.replace(/([{,\[:])\s*'([^']*)'\s*([,\]}])/g, (match, p1, p2, p3) => {
            return `${p1}"${p2}"${p3}`;
        });

        return healed;
    },

    /**
     * Cleans conversational text from AI and extracts the JSON array
     */
    cleanJson: (raw: string): string => {
        let cleaned = raw.trim();
        
        // Remove markdown code blocks if present
        if (cleaned.startsWith('```')) {
            const lines = cleaned.split('\n');
            if (lines[0].startsWith('```')) lines.shift();
            if (lines[lines.length - 1].startsWith('```')) lines.pop();
            cleaned = lines.join('\n').trim();
        }

        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        const start = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket) ? firstBrace : firstBracket;
        
        const lastBrace = cleaned.lastIndexOf('}');
        const lastBracket = cleaned.lastIndexOf(']');
        const end = Math.max(lastBrace, lastBracket);

        if (start !== -1 && end !== -1 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }

        return JsonValidator.repairJson(cleaned);
    },

    /**
     * Validates the schema of generated questions
     */
    validateBatch: (jsonString: string): ValidationResult => {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            questions: []
        };

        try {
            const cleaned = JsonValidator.cleanJson(jsonString);
            const parsed = JSON.parse(cleaned);
            
            // AI might wrap in { "questions": [...] } or just return [...]
            const rawItems = Array.isArray(parsed) ? parsed : (parsed.questions || []);

            if (!Array.isArray(rawItems)) {
                throw new Error("Payload must be an array or contain a 'questions' array.");
            }

            result.questions = rawItems.map((item: any, index: number) => {
                const errors: string[] = [];
                const idx = index + 1;

                if (!item.questionText) errors.push(`Q${idx}: Missing questionText`);
                if (!Array.isArray(item.options) || item.options.length < 2) errors.push(`Q${idx}: Options must be an array of at least 2 items`);
                if (!item.correctAnswer) errors.push(`Q${idx}: Missing correctAnswer`);
                if (item.correctAnswer && !item.options?.includes(item.correctAnswer)) {
                    errors.push(`Q${idx}: Correct answer "${item.correctAnswer}" not found in options`);
                }

                if (errors.length > 0) {
                    result.isValid = false;
                    result.errors.push(...errors);
                }

                return {
                    id: `tmp-${Date.now()}-${index}`,
                    questionText: item.questionText || '',
                    codeSnippet: item.codeSnippet || '',
                    options: item.options || [],
                    correctAnswer: item.correctAnswer || '',
                    explanation: item.explanation || '',
                    difficulty: (item.difficulty || 'intermediate') as any,
                    depthLevel: parseInt(item.depthLevel) || 5,
                    mappingType: (item.mappingType || 'technical') as any,
                    skillNames: Array.isArray(item.skillNames) ? item.skillNames : []
                };
            });

            if (result.questions.length === 0) {
                result.isValid = false;
                result.errors.push("No questions found in payload.");
            }

        } catch (e: any) {
            result.isValid = false;
            result.errors.push(`Critical Parsing Error: ${e.message}`);
        }

        return result;
    }
};
