export const getSummaryPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the SUMMARY SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**:
- Make the summary specific to ${subtopicName}
- Do not provide generic course advice
- Keep every checklist item actionable`;
