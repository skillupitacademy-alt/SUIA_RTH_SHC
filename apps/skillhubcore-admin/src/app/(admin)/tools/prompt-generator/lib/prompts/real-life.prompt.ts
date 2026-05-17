export const getRealLifePrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => `Generate content for the REAL LIFE EXAMPLES SECTION

**Educational Hierarchy:**
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}

Generate detailed content specifically for the subtopic: "${subtopicName}"

This section shows how this concept is used in real companies and industries.

This section has multiple structured blocks. Please follow the strict JSON format provided below.

**IMPORTANT**: 
- Use real company names (Amazon, Netflix, Google, Uber, Airbnb, etc.)
- Include actual salary ranges and statistics
- Make scenarios specific and relatable
- Icon names: Code, Layers, Briefcase, Award, ShoppingCart, Heart, DollarSign, BookOpen, Film, Share2`;
