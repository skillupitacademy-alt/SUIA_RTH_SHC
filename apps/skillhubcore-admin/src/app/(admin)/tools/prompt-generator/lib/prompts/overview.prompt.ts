export const getOverviewPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the OVERVIEW SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate the top landing/overview content for the subtopic page. This is the first tab learners see before Notes, Layman, Real Life, Technical, Code, Visual, Practice, Assignment, Project, Quiz, Summary, Interview, and AI Tutor.

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**:
- The title and description must be specific to ${subtopicName}
- Do not reuse Component Architecture text unless the subtopic is actually Component Architecture
- Keep roadmap cards aligned with the exact section types shown above
- Keep all JSON valid and use double quotes only`;
