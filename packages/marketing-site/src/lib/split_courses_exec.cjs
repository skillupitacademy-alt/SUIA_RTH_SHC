/**
 * Splits CoursesCardData.ts into logical group files.
 * Run: node packages/marketing-site/src/lib/split_courses_exec.cjs
 */

const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname);
const srcFile = path.join(libDir, 'CoursesCardData.ts');
const src = fs.readFileSync(srcFile, 'utf8');
const lines = src.split('\n');

const totalLines = lines.length;
console.log(`Total lines: ${totalLines}`);

// Get a range of lines (1-indexed, inclusive)
function L(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

// Write file helper
function write(filename, content) {
  const target = path.join(libDir, filename);
  fs.writeFileSync(target, content, 'utf8');
  const count = content.split('\n').length;
  console.log(`  ✅ Written ${filename} (${count} lines)`);
}

// ─────────────────────────────────────────────────────────
// 1. CourseTypes.ts  (interfaces only, no data, lines 1-21 + 22-295 + 786-841 + 959-1004 + 1067-1090)
// ─────────────────────────────────────────────────────────
const courseTypes = `// Auto-generated: types and interfaces for course data
${L(1, 21)}

${L(22, 295)}

${L(786, 841)}

${L(959, 1005)}

${L(1067, 1090)}
`;
write('CourseTypes.ts', courseTypes);

// ─────────────────────────────────────────────────────────
// 2. HeroCommonData.ts (lines 296-785)
// ─────────────────────────────────────────────────────────
const heroCommon = `// Auto-generated: shared hero, grading, placement, success story data
import { IconType } from "react-icons";
import {
  FaShieldAlt, FaBolt, FaCode, FaDatabase, FaCloud,
  FaChartLine, FaChartBar, FaMicrochip, FaTerminal, FaBrain
} from "react-icons/fa";
import type { HeroCommonData } from "./CourseTypes";

${L(296, 785)}
`;
write('HeroCommonData.ts', heroCommon);

// ─────────────────────────────────────────────────────────
// 3. CommunityData.ts (lines 842-1145)
// ─────────────────────────────────────────────────────────
const communityContent = `// Auto-generated: community, timeline, technical support data
import { IconType } from "react-icons";
import {
  FaShieldAlt, FaBolt, FaCode, FaDatabase, FaCloud,
  FaChartLine, FaChartBar, FaMicrochip, FaTerminal, FaBrain
} from "react-icons/fa";

${L(842, 1145)}
`;
write('CommunityData.ts', communityContent);

// ─────────────────────────────────────────────────────────
// Find course boundaries by slug
// ─────────────────────────────────────────────────────────
const slugLineMap = {};
lines.forEach((line, i) => {
  const m = line.match(/\s+slug:\s+"([^"]+)"/);
  if (m && !line.includes('string;')) {
    slugLineMap[m[1]] = i + 1; // 1-indexed
  }
});
console.log('\nSlug line positions:', slugLineMap);

// Find the end of each course block (look for next top-level `{` at same depth)
// Simpler: find line positions and use the gaps
const slugOrder = [
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
  'machine-learning-specialist',
];

// Find start of each course object by looking backward from slug line for `  {`
function findCourseStart(slugLine) {
  for (let i = slugLine - 2; i >= 0; i--) {
    if (lines[i].match(/^  \{/)) return i + 1; // 1-indexed
  }
  return slugLine - 5;
}

// Find end of each course object (depth-based from start)
function findCourseEnd(startLine) {
  let depth = 0;
  for (let i = startLine - 1; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          // Check if next non-empty line has a comma
          return i + 1; // 1-indexed
        }
      }
    }
  }
  return lines.length;
}

const courseBoundaries = {};
slugOrder.forEach(slug => {
  if (!slugLineMap[slug]) { console.log(`  ⚠️  Slug not found: ${slug}`); return; }
  const start = findCourseStart(slugLineMap[slug]);
  const end = findCourseEnd(start);
  courseBoundaries[slug] = { start, end };
  console.log(`  ${slug}: lines ${start}-${end} (${end - start + 1} lines)`);
});

// ─────────────────────────────────────────────────────────
// 4. Create courses directory
// ─────────────────────────────────────────────────────────
const coursesDir = path.join(libDir, 'courses');
if (!fs.existsSync(coursesDir)) fs.mkdirSync(coursesDir);

const iconImports = `import { IconType } from "react-icons";
import {
  FaShieldAlt, FaBolt, FaCode, FaDatabase, FaCloud,
  FaChartLine, FaChartBar, FaMicrochip, FaTerminal, FaBrain
} from "react-icons/fa";
import type { Course } from "../CourseTypes";
`;

// ─────────────────────────────────────────────────────────
// 5. DataScienceCourses.ts
// ─────────────────────────────────────────────────────────
const dsSlugs = ['data-analyst', 'data-science-ai-bootcamp', 'data-engineering', 'machine-learning-specialist'];
const dsCourses = dsSlugs.map(slug => {
  if (!courseBoundaries[slug]) return `// ${slug} not found`;
  const { start, end } = courseBoundaries[slug];
  return L(start, end);
}).join('\n');

write('courses/DataScienceCourses.ts', `${iconImports}
// Data Science, AI & Data Engineering Courses
export const dataScienCourses: Course[] = [
${dsCourses}
];
`);

// ─────────────────────────────────────────────────────────
// 6. FullStackCourses.ts
// ─────────────────────────────────────────────────────────
const fsSlugs = ['full-stack-java', 'python-programming', 'full-stack-php', 'full-stack-mern'];
const fsCourses = fsSlugs.map(slug => {
  if (!courseBoundaries[slug]) return `// ${slug} not found`;
  const { start, end } = courseBoundaries[slug];
  return L(start, end);
}).join('\n');

write('courses/FullStackCourses.ts', `${iconImports}
// Full Stack Development Courses
export const fullStackCourses: Course[] = [
${fsCourses}
];
`);

// ─────────────────────────────────────────────────────────
// 7. SecurityCourses.ts
// ─────────────────────────────────────────────────────────
const secSlugs = ['cybersecurity-professional', 'ethical-hacking-expert'];
const secCourses = secSlugs.map(slug => {
  if (!courseBoundaries[slug]) return `// ${slug} not found`;
  const { start, end } = courseBoundaries[slug];
  return L(start, end);
}).join('\n');

write('courses/SecurityCourses.ts', `${iconImports}
// Cybersecurity & Ethical Hacking Courses
export const securityCourses: Course[] = [
${secCourses}
];
`);

// ─────────────────────────────────────────────────────────
// 8. SpecialistCourses.ts
// ─────────────────────────────────────────────────────────
const spSlugs = ['algorithmic-trading', 'devops-engineering'];
const spCourses = spSlugs.map(slug => {
  if (!courseBoundaries[slug]) return `// ${slug} not found`;
  const { start, end } = courseBoundaries[slug];
  return L(start, end);
}).join('\n');

write('courses/SpecialistCourses.ts', `${iconImports}
// Specialist Courses: Trading, DevOps
export const specialistCourses: Course[] = [
${spCourses}
];
`);

// ─────────────────────────────────────────────────────────
// 9. New thin CoursesCardData.ts index
// ─────────────────────────────────────────────────────────
const tailLines = L(4472, totalLines); // courseIcons, getIcon, filters, etc.

const newIndex = `// Auto-generated index — imports from split course files
import { IconType } from "react-icons";
import {
  FaShieldAlt, FaBolt, FaCode, FaDatabase, FaCloud,
  FaChartLine, FaChartBar, FaMicrochip, FaTerminal, FaBrain
} from "react-icons/fa";

export * from "./CourseTypes";
export * from "./HeroCommonData";
export * from "./CommunityData";

import { dataScienCourses } from "./courses/DataScienceCourses";
import { fullStackCourses } from "./courses/FullStackCourses";
import { securityCourses } from "./courses/SecurityCourses";
import { specialistCourses } from "./courses/SpecialistCourses";

export { dataScienCourses, fullStackCourses, securityCourses, specialistCourses };

export const allCourses = [
  ...dataScienCourses,
  ...fullStackCourses,
  ...securityCourses,
  ...specialistCourses,
];

${tailLines}
`;
write('CoursesCardDataNew.ts', newIndex);

console.log('\n✅ Split complete! Review the files then rename CoursesCardDataNew.ts → CoursesCardData.ts');
console.log('⚠️  Note: You will need to fix imports in components that import from CoursesCardData.ts');
