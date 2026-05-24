const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'packages/marketing-site/src/lib/CoursesCardData.ts');
const content = fs.readFileSync(file, 'utf8');

// We will extract courses one by one
const courses = [
  'data-analyst',
  'data-science-ai-bootcamp',
  'full-stack-java',
  'python-programming',
  'full-stack-php',
  'full-stack-mern',
  'cybersecurity-professional',
  'ethical-hacking-expert',
  'data-engineering',
  'algorithmic-trading',
  'devops-engineering',
  'machine-learning-specialist'
];

function extractCourse(content, slug) {
  const lines = content.split('\n');
  const slugIndex = lines.findIndex(l => l.includes('slug: "' + slug + '"'));
  
  if (slugIndex === -1) return null;
  
  let startIdx = slugIndex;
  
  while (startIdx >= 0) {
     if (lines[startIdx].trim() === '{') break;
     startIdx--;
  }
  
  let endIdx = startIdx;
  let braceCount = 0;
  let started = false;
  
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    for (let char of line) {
      if (char === '{') {
        braceCount++;
        started = true;
      }
      if (char === '}') braceCount--;
    }
    if (started && braceCount === 0) {
      endIdx = i;
      break;
    }
  }
  
  return {
    startLine: startIdx,
    endLine: endIdx,
    code: lines.slice(startIdx, endIdx + 1).join('\n')
  };
}

const extracted = {};
for (const slug of courses) {
  const res = extractCourse(content, slug);
  if (res) {
    extracted[slug] = res;
    console.log(`Found ${slug}: lines ${res.startLine + 1}-${res.endLine + 1}`);
  } else {
    console.log(`Could not find ${slug}`);
  }
}
