/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { GeneratedQuestion, ValidationResult } from '../../types/factory';

export const JsonValidator = {
    /**
     * Attempts to heal common JSON syntax errors from AI
     */
    repairJson: (raw: string): { healed: string, stats: any } => {
        let healed = raw.trim();
        const stats = {
            trailingCommas: 0,
            unescapedQuotes: 0,
            unquotedKeys: 0
        };

        // 1. Contextual Content Healing: Escape unescaped internal double quotes in values
        // We target specific keys that usually contain text/code to avoid mangling the whole structure
        const keysToHeal = ['questionText', 'codeSnippet', 'explanation', 'correctAnswer', 'options'];
        keysToHeal.forEach(key => {
            // Regex matches "key": " ... " where the end is followed by structural markers
            // We use a stricter lookahead to ensure the comma isn't just part of the text
            const regex = new RegExp(`("${key}"\\s*:\\s*")([\\s\\S]*?)("\\s*(?=[}\\]]|,\\s*(?:\\r?\\n|"[^"]+"\\s*:|}|\])))`, 'g');
            healed = healed.replace(regex, (match: string, prefix: string, content: string, suffix: string) => {
                // Safeguard: If the captured content contains another key, it's a boundary violation
                const hasAnotherKey = /"[a-zA-Z0-9_]+"\s*:/.test(content);
                if (hasAnotherKey) return match;

                if (content.includes('"')) {
                    const unescapedMatches = content.match(/(?<!\\)"/g);
                    if (unescapedMatches !== null) {
                        stats.unescapedQuotes += unescapedMatches.length;
                        const escapedContent = content.replace(/(?<!\\)"/g, '\\"');
                        return `${prefix}${escapedContent}${suffix}`;
                    }
                }
                return match;
            });
        });

        // 2. Specialized Repair for arrays (specifically the options array)
        healed = healed.replace(/("options"\s*:\s*\[)([\s\S]*?)(\]\s*(?=[,}\]]))/, (match: string, prefix: string, content: string, suffix: string) => {
            // Split by comma followed by a quote to identify individual items
            const items = content.split(/,(?=\s*")/);
            const repairedItems = items.map(item => {
                // Match from the first quote to the last quote of this item
                const itemMatch = item.match(/(\s*")([\s\S]*)(")/);
                if (itemMatch && itemMatch.length >= 4) {
                    const p = itemMatch[1];
                    const c = itemMatch[2];
                    const s = itemMatch[3];
                    const escaped = c.replace(/(?<!\\)"/g, '\\"');
                    if (escaped !== c) {
                        const matches = escaped.match(/\\"/g);
                        if (matches) stats.unescapedQuotes += matches.length;
                    }
                    return `${p}${escaped}${s}`;
                }
                return item;
            });
            return `${prefix}${repairedItems.join(',')}${suffix}`;
        });

        // 2. Remove trailing commas before closing braces/brackets
        const commaCount = (healed.match(/,\s*(?=[\]}])/g) || []).length;
        stats.trailingCommas += commaCount;
        healed = healed.replace(/,\s*([\]}])/g, '$1');

        // 3. Fix unquoted keys
        const keyMatch = healed.match(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g);
        if (keyMatch !== null) {
            stats.unquotedKeys += keyMatch.length;
            healed = healed.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
        }

        // 4. Convert single quotes to double quotes for keys/values
        healed = healed.replace(/([{,\[:])\s*'([^']*)'\s*([,\]}])/g, (match, p1, p2, p3) => {
            return `${p1}"${p2}"${p3}`;
        });

        return { healed, stats };
    },

    /**
     * Cleans conversational text from AI and extracts the JSON array
     */
    cleanJson: (raw: string): { cleaned: string, report: any } => {
        let cleaned = raw.trim();
        let conversationalStrip = false;
        
        const original = cleaned;

        // Remove markdown code blocks if present
        if (cleaned.startsWith('```')) {
            conversationalStrip = true;
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
            if (start > 0 || end < cleaned.length - 1) {
                conversationalStrip = true;
            }
            cleaned = cleaned.substring(start, end + 1);
        }

        const { healed, stats } = JsonValidator.repairJson(cleaned);
        
        const modified = conversationalStrip || stats.trailingCommas > 0 || stats.unescapedQuotes > 0 || stats.unquotedKeys > 0;

        return { 
            cleaned: healed, 
            report: {
                modified,
                stats: {
                    ...stats,
                    conversationalStrip
                }
            }
        };
    },

    /**
     * Validates the schema of generated questions
     */
    validateBatch: (jsonString: string): ValidationResult => {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            questions: [],
            healingReport: undefined
        };

        try {
            const { cleaned, report } = JsonValidator.cleanJson(jsonString);
            result.healingReport = report;
            
            const parsed = JSON.parse(cleaned);
            
            // AI might wrap in { "questions": [...] } or just return [...]
            const rawItems = Array.isArray(parsed) ? parsed : (parsed.questions || []);

            if (!Array.isArray(rawItems)) {
                throw new Error("Payload must be an array or contain a 'questions' array.");
            }

            result.questions = rawItems.map((item: any, index: number) => {
                const errors: string[] = [];
                const idx = index + 1;

                if (item.questionText === undefined || item.questionText === null || item.questionText === '') errors.push(`Q${idx}: Missing questionText`);
                if (!Array.isArray(item.options) || item.options.length < 2) errors.push(`Q${idx}: Options must be an array of at least 2 items`);
                if (item.correctAnswer === undefined || item.correctAnswer === null || item.correctAnswer === '') errors.push(`Q${idx}: Missing correctAnswer`);
                if ((item.correctAnswer !== undefined && item.correctAnswer !== null && item.correctAnswer !== '') && item.options?.includes(item.correctAnswer) === false) {
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
