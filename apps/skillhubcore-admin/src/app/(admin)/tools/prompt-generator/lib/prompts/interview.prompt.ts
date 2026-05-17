export const getInterviewPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the INTERVIEW PREP SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**:
- Make questions realistic for technical interviews
- Include both beginner and senior-style reasoning
- Keep answers concise but complete`;
