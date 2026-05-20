export const getLaymanPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the LAYMAN EXPLANATION SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section explains the concept to absolute beginners using simple language and analogies.

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**: 
- Use VERY simple language - no jargon
- Use everyday analogies (LEGO, kitchen, traffic, etc.)
- Make it relatable and encouraging
- Icon names: Briefcase, Zap, TrendingUp, Monitor, Smartphone, Globe, ShoppingCart, Heart, Lightbulb`;
