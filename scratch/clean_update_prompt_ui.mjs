import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// I will find the START of the Select Section area and the END of that container
const startMarker = '<div className="mb-6">';
const endMarker = '</header>';

const startIdx = content.indexOf(startMarker, content.indexOf('Subtopic')); // Find it after subtopic input
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const brandColor = 'brand.primaryColor'; // Reference to existing brand object
  
  const newSectionContent = `<div className="mb-6">
              <div className="block text-lg font-semibold text-gray-800 mb-3">
                Select Section
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setSelectedSection(section.id);
                      setGeneratedPrompt('');
                      setGeneratedAssetPrompt('');
                      setSelectedAssetId(null);
                    }}
                    className={\`px-6 py-4 rounded-xl font-bold text-lg transition-all border-2 \${
                      selectedSection === section.id
                        ? 'bg-blue-600 border-blue-700 text-white shadow-lg scale-105'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }\`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => generatePrompt()}
                className="w-full py-4 text-white text-xl font-black rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: ${brandColor} }}
              >
                Generate Core JSON Prompt
              </button>

              {/* Asset Buttons Row */}
              {selectedSection && ASSET_SPECS[selectedSection] && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="block text-lg font-semibold text-gray-800 mb-3">
                    Select Visual Asset (SVG) Prompt
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {ASSET_SPECS[selectedSection].map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => generatePrompt(asset.id)}
                        className={\`px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 \${
                          selectedAssetId === asset.id
                            ? 'bg-amber-500 border-amber-600 text-white shadow-md scale-105'
                            : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        }\`}
                      >
                        {asset.label}
                      </button>
                    ))}
                    <button
                      onClick={() => generatePrompt()}
                      className={\`px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 \${
                        selectedAssetId === null && generatedAssetPrompt
                          ? 'bg-slate-700 border-slate-800 text-white shadow-md'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }\`}
                    >
                      All Assets
                    </button>
                  </div>
                </div>
              )}
            </div>`;

  content = content.slice(0, startIdx) + newSectionContent + content.slice(endIdx);
  fs.writeFileSync(filePath, content);
  console.log('Cleanly updated Prompt Generator UI.');
} else {
  console.log('Could not find markers:', { startIdx, endIdx });
}
