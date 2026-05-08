const fs = require('fs');
let content = fs.readFileSync('src/share-branding/subtopicContentRegistry.ts', 'utf-8');
const lines = content.split('\n');

let startIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("'javascript-variables': {")) {
    startIndex = i;
    break;
  }
}

if (startIndex !== -1) {
  let openBraces = 0;
  let endIndex = -1;
  for (let i = startIndex; i < lines.length; i++) {
    openBraces += (lines[i].match(/\{/g) || []).length;
    openBraces -= (lines[i].match(/\}/g) || []).length;
    if (openBraces === 0) {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex !== -1) {
    console.log('Found javascript-variables from', startIndex, 'to', endIndex);
    
    let topLevelKeys = {};
    let blocksToRemove = [];
    
    openBraces = 0;
    
    for (let i = startIndex + 1; i <= endIndex; i++) {
      let line = lines[i];
      let match = line.match(/^    ([a-zA-Z0-9_]+):\s*\{/);
      
      if (openBraces === 1 && match) {
        let key = match[1];
        if (topLevelKeys[key]) {
          console.log('Duplicate key found:', key, 'at line', i + 1);
          let tempBraces = 0;
          let endOfBlock = -1;
          for (let j = i; j <= endIndex; j++) {
            tempBraces += (lines[j].match(/\{/g) || []).length;
            tempBraces -= (lines[j].match(/\}/g) || []).length;
            if (tempBraces === 0) {
              endOfBlock = j;
              break;
            }
          }
          blocksToRemove.push({start: i, end: endOfBlock, key});
        } else {
          topLevelKeys[key] = true;
          console.log('First seen key:', key, 'at line', i + 1);
        }
      } else if (openBraces === 1) {
          let match2 = line.match(/^    ([a-zA-Z0-9_]+):\s*"/);
          if (match2) {
              topLevelKeys[match2[1]] = true;
          }
      }
      
      openBraces += (line.match(/\{/g) || []).length;
      openBraces -= (line.match(/\}/g) || []).length;
    }
    
    console.log(JSON.stringify(blocksToRemove, null, 2));
  }
}
