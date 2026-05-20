import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the Header/Input tags
const headerMatch = content.match(/<header[\s\S]*?<\/header>/);
if (headerMatch) {
  let headerContent = headerMatch[0];
  // Ensure the inner div is closed and the section is closed
  if (headerContent.includes('<div className="mb-6">') && !headerContent.includes('</div>\n            </section>')) {
     headerContent = headerContent.replace(/<\/div>\s*<\/section>\s*<\/header>/, '            </div>\n            </section>\n          </header>');
     content = content.replace(/<header[\s\S]*?<\/header>/, headerContent);
  }
}

// 2. Re-apply Dual-Column Output Section
const dualColumnOutput = `        {/* Combined Dual Output Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Content Column */}
          <section className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full" aria-label="Generated content prompt output">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">1. Content Structure</h3>
              <button
                disabled={!generatedPrompt}
                onClick={copyToClipboard}
                className={\`px-4 py-2 rounded-lg font-semibold transition-all text-sm \${
                  !generatedPrompt ? 'bg-gray-200 text-gray-400' :
                  copied ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }\`}
              >
                {copied ? '✓ Copied' : 'Copy JSON Prompt'}
              </button>
            </div>
            <div className="p-6 flex-1 min-h-[400px]">
              <div className="h-full bg-gray-50 border border-gray-200 rounded-lg p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto">
                {generatedPrompt || <span className="text-gray-400 italic">Content architecture will appear here...</span>}
              </div>
            </div>
          </section>

          {/* Asset Column */}
          <section className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full" aria-label="Generated svg asset prompt output">
            <div className="p-6 border-b border-amber-200 flex justify-between items-center bg-amber-50">
              <h3 className="text-xl font-bold text-gray-800">2. SVG Visual Assets</h3>
              <button
                disabled={!generatedAssetPrompt}
                onClick={copyAssetPromptToClipboard}
                className={\`px-4 py-2 rounded-lg font-semibold transition-all text-sm \${
                  !generatedAssetPrompt ? 'bg-amber-100 text-amber-300' :
                  assetCopied ? 'bg-green-500 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
                }\`}
              >
                {assetCopied ? '✓ Copied' : 'Copy SVG Prompts'}
              </button>
            </div>
            <div className="p-6 flex-1 min-h-[400px]">
              <div className="h-full bg-amber-50/30 border border-amber-100 rounded-lg p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto">
                {generatedAssetPrompt || <span className="text-amber-400 italic">SVG generation prompts will appear here...</span>}
              </div>
            </div>
          </section>
        </div>`;

// Replace the old single-column output section
content = content.replace(/\{\/\* Output Section \*\/\}[\s\S]*?<\/section>/, dualColumnOutput);

fs.writeFileSync(filePath, content);
console.log('Final fix applied to Prompt Generator: Tags aligned and Dual-Column restored.');
