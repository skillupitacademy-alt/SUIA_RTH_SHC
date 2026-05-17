export const getVisualPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the VISUAL EXPLANATION SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section uses diagrams, flowcharts, and visual aids to explain concepts.

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**: 
- Describe visuals in text format
- Use clear, descriptive language
- Include 5 steps in flowchart (start, process, decision, process, end)
- Include 4 timeline events, 3 architecture layers, 4 mind map branches`;
