export const getAssignmentPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the ASSIGNMENT SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section provides a hands-on assignment for learners to practice.

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**: 
- Make it practical and achievable
- Provide clear requirements
- Include starter code with TODOs
- Difficulty levels: beginner, intermediate, advanced`;
