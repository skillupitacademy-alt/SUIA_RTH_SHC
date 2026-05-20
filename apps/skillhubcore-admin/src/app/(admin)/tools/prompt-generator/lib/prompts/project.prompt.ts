export const getProjectPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the PROJECT SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section provides a larger, more comprehensive project to build.

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**: 
- Make it a real, portfolio-worthy project
- Provide clear phases and milestones
- Include 4 implementation phases
- 3 must-have features, 2 nice-to-have features`;
