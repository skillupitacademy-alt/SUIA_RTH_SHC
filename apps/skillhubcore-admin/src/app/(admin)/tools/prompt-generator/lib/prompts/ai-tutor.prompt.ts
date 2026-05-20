export const getAiTutorPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the AI TUTOR SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed tutor content specifically for the subtopic: "${subtopicName}"

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**:
- The tutor answers should sound conversational but technically accurate
- Include misconceptions that beginners actually have
- Keep hints progressive from subtle to direct`;
