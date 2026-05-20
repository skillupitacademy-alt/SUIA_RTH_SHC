export const getMasterPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `I need you to generate educational content for a subtopic in a structured format.

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

**TARGET AUDIENCE**: Beginners to intermediate learners
**TONE**: Clear, friendly, educational, practical

**IMPORTANT RULES**:
1. Output MUST be in valid JSON format
2. Use double quotes for all strings
3. Escape special characters properly
4. Keep explanations clear and concise
5. Use real-world examples
6. Avoid jargon unless explained
7. Include practical applications

I will ask you to generate content for tutorial page sections one by one. Each section prompt will include a strict canonical DB/rendering schema with schemaVersion and sectionType. Follow that structure exactly; malformed or missing fields will be rejected by content-manager before database save.

Are you ready? Reply "Ready" and I'll give you the first section.`;
