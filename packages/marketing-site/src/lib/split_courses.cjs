/**
 * Split CoursesCardData.ts into logical files:
 * 
 * 1. CourseTypes.ts          - All interfaces/types (lines 1-295 + 786-841)
 * 2. HeroCommonData.ts       - heroCommonData constant (lines 296-785)
 * 3. CommunityData.ts        - community/timeline/support data (lines 842-1145)
 * 4. DataScienceCourses.ts   - data-analyst, data-science-ai-bootcamp, data-engineering, machine-learning-specialist
 * 5. FullStackCourses.ts     - full-stack-java, python-programming, full-stack-php, full-stack-mern
 * 6. SecurityCourses.ts      - cybersecurity-professional, ethical-hacking-expert
 * 7. SpecialistCourses.ts    - algorithmic-trading, devops-engineering
 * 8. CoursesCardData.ts      - thin index that imports & re-exports everything
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'CoursesCardData.ts');
const content = fs.readFileSync(srcPath, 'utf8');
const lines = content.split('\n');

function getLines(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

// Helper to write file
function writeFile(filename, content) {
  fs.writeFileSync(path.join(__dirname, filename), content, 'utf8');
  console.log(`Written: ${filename} (${content.split('\n').length} lines)`);
}

// ─────────────────────────────────────────────
// 1. CourseTypes.ts
// ─────────────────────────────────────────────
const imports = getLines(1, 21);  // imports
const types1 = getLines(22, 295); // interfaces before heroCommonData
const types2 = getLines(786, 841); // AssessmentCard, CertificateData, AssessmentCertificationData, Course interfaces

const courseTypesContent = `${imports}

${types1}

${types2}
`;
writeFile('CourseTypes.ts', courseTypesContent);

// ─────────────────────────────────────────────
// 2. HeroCommonData.ts  
// ─────────────────────────────────────────────
const heroImports = `import { IconType } from "react-icons";
import {
  FaShieldAlt, FaBolt, FaCode, FaDatabase, FaCloud,
  FaChartLine, FaChartBar, FaMicrochip, FaTerminal, FaBrain
} from "react-icons/fa";
import type { HeroCommonData } from "./CourseTypes";
`;
const heroData = getLines(296, 785);

const heroCommonDataContent = `${heroImports}

${heroData}
`;
writeFile('HeroCommonData.ts', heroCommonDataContent);

// ─────────────────────────────────────────────
// 3. CommunityData.ts
// ─────────────────────────────────────────────
const communityImports = `import { IconType } from "react-icons";
import {
  FaShieldAlt, FaBolt, FaCode, FaDatabase, FaCloud,
  FaChartLine, FaChartBar, FaMicrochip, FaTerminal, FaBrain
} from "react-icons/fa";
import type {
  CommunityIconType, CommunityData, AlumniBenefits, CommunitySectionData,
  ScheduleItem, TimelineItem, LearningExperience, LearningExperienceTimelineData,
  TechnicalSupportFeature, SupportChannel, TechnicalSupportData
} from "./CourseTypes";
`;
const communityData = getLines(842, 1145);

const communityDataContent = `${communityImports}

${communityData}
`;
writeFile('CommunityData.ts', communityDataContent);

// ─────────────────────────────────────────────
// Find course boundaries in allCourses array
// ─────────────────────────────────────────────
const fullContent = content;

// Find slug positions
function findSlugRange(slug) {
  const slugPattern = `slug: "${slug}"`;
  const idx = fullContent.indexOf(slugPattern);
  if (idx === -1) return null;
  
  // Find the start of this course object (find preceding '{' at proper depth)
  let start = idx;
  while (start > 0 && fullContent[start] !== '\n') start--;
  
  // Walk back to find the opening {  for this course
  let depth = 0;
  let i = idx;
  while (i > 0) {
    if (fullContent[i] === '}') depth++;
    if (fullContent[i] === '{') {
      if (depth === 0) break;
      depth--;
    }
    i--;
  }
  
  // Now find the end: walk forward from slug to the matching closing brace
  depth = 0;
  let j = i;
  while (j < fullContent.length) {
    if (fullContent[j] === '{') depth++;
    if (fullContent[j] === '}') {
      depth--;
      if (depth === 0) break;
    }
    j++;
  }
  
  // Include the trailing comma if present
  if (fullContent[j+1] === ',') j++;
  
  return { start: i, end: j + 1 };
}

const slugs = [
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

const courseRanges = {};
slugs.forEach(slug => {
  const range = findSlugRange(slug);
  if (range) {
    courseRanges[slug] = fullContent.slice(range.start, range.end);
    console.log(`Found course: ${slug} (${courseRanges[slug].split('\n').length} lines)`);
  } else {
    console.log(`NOT FOUND: ${slug}`);
  }
});

// Save course range data
const rangesOutput = JSON.stringify(Object.fromEntries(
  Object.entries(courseRanges).map(([k, v]) => [k, v.split('\n').length])
), null, 2);
console.log('\nCourse line counts:', rangesOutput);
