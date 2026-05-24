const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'packages/marketing-site/src/lib');
const coursesDir = path.join(srcDir, 'courses');

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

const knownFaIcons = [
  'FaShieldAlt', 'FaBolt', 'FaCode', 'FaDatabase', 'FaCloud', 'FaChartBar',
  'FaMicrochip', 'FaTerminal', 'FaBrain', 'FaSlack', 'FaComments', 'FaTrophy',
  'FaHandshake', 'FaGraduationCap', 'FaNetworkWired', 'FaChartLine', 'FaVideo',
  'FaUserGraduate', 'FaQuestionCircle', 'FaCalendarAlt', 'FaLaptopCode',
  'FaCalendarDay', 'FaUsers', 'FaHeadset', 'FaChalkboardTeacher', 'FaDownload',
  'FaBug', 'FaCodeBranch', 'FaWhatsapp', 'FaEnvelope'
];

function toCamelCase(str) {
  return str.split('-').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

for (const slug of courses) {
  const filePath = path.join(coursesDir, `${slug}.ts`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Clean up old bad imports
  content = content.replace(/import \{.*\} from 'react-icons\/(fa|fi|si|md)';\n/g, '');
  content = content.replace(/import \{ Course \} from '\.\.\/CourseTypes';\n/g, '');
  
  const iconsUsed = knownFaIcons.filter(icon => content.includes(icon));
  
  let newImports = `import { Course } from '../CoursesCardData';\n`;
  if (iconsUsed.length > 0) {
    newImports += `import { ${iconsUsed.join(', ')} } from 'react-icons/fa';\n`;
  }
  
  // also fix trailing commas in the last line of the object
  content = content.trim();
  if (content.endsWith(',')) content = content.slice(0, -1) + ';';
  if (!content.endsWith(';')) content += ';';
  
  fs.writeFileSync(filePath, newImports + '\n' + content);
}

console.log("Fixed courses files");
