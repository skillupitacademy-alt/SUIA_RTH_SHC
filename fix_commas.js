const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'packages/marketing-site/src/lib/courses');

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.ts'));

for (const f of files) {
  const filePath = path.join(srcDir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace `},;` or `},\n;` with just `};`
  content = content.replace(/\},\s*;/g, '};');
  // Just in case it ends with `},` without a semicolon
  content = content.replace(/\},\s*$/g, '};');
  
  fs.writeFileSync(filePath, content);
}
console.log("Fixed trailing commas");
