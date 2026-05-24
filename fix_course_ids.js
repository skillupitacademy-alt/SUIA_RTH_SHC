const fs = require('fs');
const path = require('path');

const coursesDir = path.join(__dirname, 'packages/marketing-site/src/lib/courses');

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

courses.forEach((slug, index) => {
  const filePath = path.join(coursesDir, `${slug}.ts`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update the top-level id (should be the first occurrence of `id: ` or `id: \d+,`)
  // We can use a regex that only matches the first `id:`
  let idUpdated = false;
  content = content.replace(/id:\s*\d+,/, (match) => {
    if (!idUpdated) {
      idUpdated = true;
      return `id: ${index + 1},`;
    }
    return match;
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${slug} to id: ${index + 1}`);
});
