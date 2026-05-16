import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The problematic area is:
//               )}
//                         </section>
//           </header>

content = content.replace(
  /\s+\)\}\s+<\/section>\s+<\/header>/,
  `
              )}
            </div>
            </section>
          </header>`
);

fs.writeFileSync(filePath, content);
console.log('Explicitly added missing </div> to Prompt Generator.');
