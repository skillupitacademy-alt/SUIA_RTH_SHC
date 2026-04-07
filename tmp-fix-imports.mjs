import fs from 'fs';
import path from 'path';

const COMPONENT_DIR = 'd:\\onlinewebsites\\quiz-platform\\src\\share-branding\\Dashboard\\components';

async function main() {
  const files = fs.readdirSync(COMPONENT_DIR).filter(f => f.endsWith('.tsx'));
  
  for (const file of files) {
    const filePath = path.join(COMPONENT_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix "@/" alias to use relative path since Next.js apps resolve "@/" to their own src directories
    content = content.replace(
      /@\/share-branding\/PostLandingPage\/app\/context\/BrandContext/g,
      "../../PostLandingPage/app/context/BrandContext"
    );

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed imports in ${file}`);
  }
}

main().catch(console.error);
