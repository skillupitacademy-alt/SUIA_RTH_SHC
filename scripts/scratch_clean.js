const fs = require('fs');
let lines = fs.readFileSync('src/share-branding/subtopicContentRegistry.ts', 'utf-8').split('\n');

// Perform splices from bottom to top so indices don't shift
lines.splice(4116, 516); // Deletes 4117 to 4632
lines.splice(3465, 164); // Deletes 3466 to 3629
lines.splice(3048, 160); // Deletes 3049 to 3208

fs.writeFileSync('src/share-branding/subtopicContentRegistry.ts', lines.join('\n'));
