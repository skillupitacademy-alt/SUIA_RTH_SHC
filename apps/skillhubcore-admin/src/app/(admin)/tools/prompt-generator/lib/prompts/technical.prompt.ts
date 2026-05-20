export const getTechnicalPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the TECHNICAL DEEP DIVE SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section is for intermediate to advanced learners who want to understand the internal mechanics.

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**: 
- Use technical terminology appropriately
- Include actual code examples with proper escaping (use \\\\n for newlines, \\\\" for quotes)
- Focus on implementation details
- Explain the "why" behind design decisions
- Each section should be self-contained but build on previous sections`;
