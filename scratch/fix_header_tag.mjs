import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The target might be broken now, let's look for the header part
const headerMatch = content.match(/<header[\s\S]*?<\/header>/);
if (headerMatch) {
  let headerContent = headerMatch[0];
  
  // Ensure the section is closed
  if (headerContent.includes('<section className="p-8">') && !headerContent.includes('</section>')) {
     headerContent = headerContent.replace(/<\/div>\s*<\/header>/, '            </section>\n          </header>');
     content = content.replace(/<header[\s\S]*?<\/header>/, headerContent);
     fs.writeFileSync(filePath, content);
     console.log('Fixed header section tag.');
  } else {
     console.log('Header section already closed or not found.');
  }
}
