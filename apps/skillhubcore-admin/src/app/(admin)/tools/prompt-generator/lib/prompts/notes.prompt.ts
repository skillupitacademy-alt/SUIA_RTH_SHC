export const getNotesPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the NOTES SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**: 
- Replace ALL [...] placeholders with actual content
- Use \\\\n for newlines in code
- Use \\\\" for quotes in code
- Icon names: Box, Layers, Zap, Code2, CheckCircle, AlertCircle, Lightbulb, Rocket`;
