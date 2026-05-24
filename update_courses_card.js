const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'packages/marketing-site/src/lib/CoursesCardData.ts');
let content = fs.readFileSync(file, 'utf8');

const replacement = `import { dataAnalystCourse } from './courses/data-analyst';
import { dataScienceAiBootcampCourse } from './courses/data-science-ai-bootcamp';
import { fullStackJavaCourse } from './courses/full-stack-java';
import { pythonProgrammingCourse } from './courses/python-programming';
import { fullStackPhpCourse } from './courses/full-stack-php';
import { fullStackMernCourse } from './courses/full-stack-mern';
import { cybersecurityProfessionalCourse } from './courses/cybersecurity-professional';
import { ethicalHackingExpertCourse } from './courses/ethical-hacking-expert';
import { dataEngineeringCourse } from './courses/data-engineering';
import { algorithmicTradingCourse } from './courses/algorithmic-trading';
import { devopsEngineeringCourse } from './courses/devops-engineering';
import { machineLearningSpecialistCourse } from './courses/machine-learning-specialist';

export const allCourses: Course[] = [
  dataAnalystCourse,
  dataScienceAiBootcampCourse,
  fullStackJavaCourse,
  pythonProgrammingCourse,
  fullStackPhpCourse,
  fullStackMernCourse,
  cybersecurityProfessionalCourse,
  ethicalHackingExpertCourse,
  dataEngineeringCourse,
  algorithmicTradingCourse,
  devopsEngineeringCourse,
  machineLearningSpecialistCourse,
];`;

const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.startsWith('export const allCourses: Course[] = ['));
if (startIndex === -1) {
  console.log("Could not find start index");
  process.exit(1);
}

let endIndex = startIndex;
while (endIndex < lines.length) {
  if (lines[endIndex].trim() === '];') {
     // double check if it's the right one
     if (endIndex > startIndex + 1000) {
       break;
     }
  }
  endIndex++;
}

lines.splice(startIndex, endIndex - startIndex + 1, replacement);

fs.writeFileSync(file, lines.join('\n'));
console.log("Updated CoursesCardData.ts");
