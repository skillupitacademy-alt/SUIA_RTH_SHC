import fs from 'fs';
import path from 'path';

const COMPONENT_DIR = 'd:\\onlinewebsites\\quiz-platform\\src\\share-branding\\Dashboard\\components';

async function main() {
  const files = fs.readdirSync(COMPONENT_DIR).filter(f => f.endsWith('.tsx'));
  
  for (const file of files) {
    const filePath = path.join(COMPONENT_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace imports
    content = content.replace(
      /import\s+\{\s*useTheme\s*\}\s+from\s+['"]\.\.\/contexts\/ThemeContext['"];?/g,
      "import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';"
    );
    
    // Replace hooks
    content = content.replace(/const\s+\{\s*theme\s*\}\s*=\s*useTheme\(\);/g, "const brand = useBrand();");
    
    // Replace variables
    content = content.replace(/theme\.primaryGlow/g, "brand.primaryColor"); // Simplified since we stripped gradients, but if used for shadow, CSS variable or dynamic style handles it or pure color mapping. Wait, let's map it safely.
    content = content.replace(/theme\.secondaryGlow/g, "brand.secondaryColor");
    content = content.replace(/theme\.primary/g, "brand.primaryColor");
    content = content.replace(/theme\.secondary/g, "brand.secondaryColor");
    content = content.replace(/theme\.brandName/g, "brand.name");
    content = content.replace(/theme\.tutorLabel/g, "brand.tutorLabel");
    content = content.replace(/theme\.systemLabel/g, "brand.dashboardGreeting");
    content = content.replace(/theme\.graphLabel/g, "(brand as any).graphLabel || 'Competency Map'");

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
}

main().catch(console.error);
