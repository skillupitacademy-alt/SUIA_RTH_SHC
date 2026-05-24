const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'packages/marketing-site/src/lib');
const coursesDir = path.join(srcDir, 'courses');
if (!fs.existsSync(coursesDir)) {
  fs.mkdirSync(coursesDir);
}

const file = path.join(srcDir, 'CoursesCardData.ts');
const content = fs.readFileSync(file, 'utf8');

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

// Helper to convert slug to camelCase name
function toCamelCase(str) {
  return str.split('-').map((word, index) => {
    if (index === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join('');
}

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
      if (char === '{') { braceCount++; started = true; }
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

let allCoursesImports = [];
let allCoursesArray = [];

for (const slug of courses) {
  const res = extractCourse(content, slug);
  if (!res) {
    console.log(`Could not find ${slug}`);
    continue;
  }
  
  const varName = toCamelCase(slug) + 'Course';
  allCoursesImports.push(`import { ${varName} } from './courses/${slug}';`);
  allCoursesArray.push(`  ${varName},`);
  
  // Find react-icons used
  const icons = new Set();
  const iconRegex = /\b(Fa[A-Za-z]+|Fi[A-Za-z]+|Si[A-Za-z]+|Md[A-Za-z]+)\b/g;
  let match;
  while ((match = iconRegex.exec(res.code)) !== null) {
    icons.add(match[1]);
  }
  
  let importsStr = `import { Course } from '../CourseTypes';\n`;
  
  const faIcons = Array.from(icons).filter(i => i.startsWith('Fa'));
  if (faIcons.length > 0) {
    importsStr += `import { ${faIcons.join(', ')} } from 'react-icons/fa';\n`;
  }
  const fiIcons = Array.from(icons).filter(i => i.startsWith('Fi'));
  if (fiIcons.length > 0) {
    importsStr += `import { ${fiIcons.join(', ')} } from 'react-icons/fi';\n`;
  }
  // add others if necessary, assuming mostly Fa and Fi
  
  let fileContent = `${importsStr}\nexport const ${varName}: Course = ${res.code};\n`;
  // Clean up trailing comma if present in the object string at the end
  if (fileContent.trim().endsWith(',')) {
     fileContent = fileContent.trim().slice(0, -1) + ';\n';
  } else if (!fileContent.trim().endsWith(';')) {
     fileContent = fileContent.trim() + ';\n';
  }
  
  fs.writeFileSync(path.join(coursesDir, `${slug}.ts`), fileContent);
  console.log(`Written ${slug}.ts`);
}

// Generate the replacement array for CoursesCardData.ts
console.log('\n--- Replacement for allCourses ---');
console.log(allCoursesImports.join('\n'));
console.log('\nexport const allCourses: Course[] = [');
console.log(allCoursesArray.join('\n'));
console.log('];');
