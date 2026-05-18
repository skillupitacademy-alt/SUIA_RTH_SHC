const fs = require('fs');
const path = require('path');

const files = [
  { name: 'component-architecture.ts', key: 'component-architecture' },
  { name: 'whatisjavascript.ts', key: 'whatisjavascript' },
  { name: 'variable.ts', key: 'variable' }
];

const dir = path.join('d:', 'onlinewebsites', 'quiz-platform', 'src', 'share-branding', 'subtopics');

for (const file of files) {
  const filePath = path.join(dir, file.name);
  console.log(`Processing ${file.name}...`);
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  
  // Find the line containing the key wrapper (usually line index 3, which is line 4)
  let keyLineIndex = -1;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (lines[i].includes(`'${file.key}': {`)) {
      keyLineIndex = i;
      break;
    }
  }
  
  if (keyLineIndex !== -1) {
    console.log(`  Found key wrapper at line ${keyLineIndex + 1}: ${lines[keyLineIndex].trim()}`);
    // Remove that line
    lines.splice(keyLineIndex, 1);
    
    // Now find the closing brace from the bottom of the file
    // Let's search upwards from the end
    let foundClosingBrace = false;
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim();
      if (trimmed === '}' || trimmed === '},' || trimmed === '};') {
        // The last line is the export declaration closing brace (};)
        // The one we want to remove is the one just before it that closes the wrapped key
        // In our files, the end looks like:
        //   }
        // };
        // or
        //   },
        // };
        // Let's find the first one that is indented with exactly 2 spaces or is '}' or '},'
        // let's look for `  }` or `  },`
        if (lines[i].startsWith('  }') || lines[i].startsWith('  },')) {
          console.log(`  Removing closing wrapper brace at line ${i + 1}: ${lines[i]}`);
          lines.splice(i, 1);
          foundClosingBrace = true;
          break;
        }
      }
    }
    
    if (!foundClosingBrace) {
      console.warn(`  Could not find closing wrapper brace!`);
    } else {
      // Let's write the file back
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      console.log(`  Successfully processed ${file.name}`);
    }
  } else {
    console.warn(`  Could not find key wrapper for ${file.key}`);
  }
}
