export const getCodePrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the CODE EXAMPLE SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section provides hands-on code examples with detailed explanations.

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**: 
- All code must be valid and runnable
- Use proper JSON escaping: \\\\n for newlines, \\\\" for quotes
- Include complete, working examples
- Explain the "why" not just the "what"`;
