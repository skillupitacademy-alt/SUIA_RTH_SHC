import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Move assetSpecs to a constant outside the function
const assetSpecsCode = `const ASSET_SPECS: Record<string, Array<{ id: string; label: string; fieldPath: string; width: number; height: number; purpose: string }>> = {
  layman: [
    {
      id: 'layman-analogy',
      label: 'Everyday Analogy',
      fieldPath: 'everydayAnalogy.image',
      width: 1200,
      height: 700,
      purpose: 'Create a clean educational analogy illustration that visually explains the everyday comparison for this subtopic.',
    },
    {
      id: 'layman-overview',
      label: 'Concept Overview',
      fieldPath: 'simpleOverview.image',
      width: 1200,
      height: 700,
      purpose: 'Create a simple, welcoming visual that introduces the concept to a complete beginner.',
    },
  ],
  notes: [
    {
      id: 'notes-summary',
      label: 'Revision Summary',
      fieldPath: 'summaryCard.image',
      width: 1200,
      height: 700,
      purpose: 'Create a summary infographic that visually reinforces the core idea, memory hook, and revision intent of the Notes section.',
    },
    {
      id: 'notes-hero',
      label: 'Hero Infographic',
      fieldPath: 'summaryHeroInfographic.image',
      width: 1440,
      height: 800,
      purpose: 'A large, premium hero infographic that explains "How it Works" at a glance for this subtopic.',
    },
    {
      id: 'notes-memory-map',
      label: 'Concept Memory Map',
      fieldPath: 'conceptMemoryMap.image',
      width: 1200,
      height: 900,
      purpose: 'A node-and-connection diagram showing the relationships between different parts of the concept.',
    },
    {
      id: 'notes-syntax',
      label: 'Syntax Diagram',
      fieldPath: 'syntaxBlock.image',
      width: 1200,
      height: 600,
      purpose: 'A visual diagram that points out and explains specific parts of the code syntax.',
    },
  ],
  code: [
    {
      id: 'code-preview',
      label: 'Output Preview',
      fieldPath: 'outputDemonstration.previewAsset',
      width: 1280,
      height: 720,
      purpose: 'Create a UI-style output preview showing before/after or result-state for the code example.',
    },
  ],
  technical: [
    {
      id: 'tech-architecture',
      label: 'System Architecture',
      fieldPath: 'sections.0.diagramAsset',
      width: 1440,
      height: 900,
      purpose: 'Create a system or runtime architecture diagram suitable for an advanced technical explanation of the subtopic.',
    },
  ],
  summary: [
    {
      id: 'summary-mastery',
      label: 'Mastery Recap',
      fieldPath: 'masteryRecapCard.heroAsset',
      width: 1200,
      height: 700,
      purpose: 'Create a celebratory recap graphic that visually summarizes the concept and completion state.',
    },
  ],
};`;

// Insert the constant before the component
content = content.replace(
  /type TutorialPromptSectionId =/,
  `${assetSpecsCode}\n\ntype TutorialPromptSectionId =`
);

// 2. Add state for selected asset
content = content.replace(
  /const \[generatedAssetPrompt, setGeneratedAssetPrompt\] = useState\(''\);/,
  `const [generatedAssetPrompt, setGeneratedAssetPrompt] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);`
);

// 3. Update getSvgAssetPromptForSection to accept an optional assetId
content = content.replace(
  /const getSvgAssetPromptForSection = \([\s\S]*?\): string => \{[\s\S]*?const assetSpecs: Record[\s\S]*?\};[\s\S]*?const selectedAssets = assetSpecs\[section\] \?\? \[\];[\s\S]*?if \(selectedAssets\.length === 0\) \{[\s\S]*?return '';[\s\S]*?\}[\s\S]*?return \`Generate SVG asset prompt specifications[\s\S]*?\};/,
  `const getSvgAssetPromptForSection = (
    section: TutorialPromptSectionId,
    domainName: string,
    subjectName: string,
    topicName: string,
    subtopicName: string,
    assetId?: string
  ): string => {
    const selectedAssets = ASSET_SPECS[section] ?? [];
    const assetsToGenerate = assetId 
      ? selectedAssets.filter(a => a.id === assetId)
      : selectedAssets;

    if (assetsToGenerate.length === 0) {
      return '';
    }

    const subtopicSlug = subtopicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return \`Generate SVG asset prompt specifications for the \${section.toUpperCase()} tutorial section.

**Educational Hierarchy:**
- Domain: \${domainName}
- Subject: \${subjectName}
- Topic: \${topicName}
- Subtopic: \${subtopicName}

**ASSET GENERATION RULES**
1. Create pure SVG artwork only. Do not return PNG, WebP, JPG, or external URLs.
2. Keep the artwork instructional, clean, and diagram-first. Avoid decorative gradients, stock-photo style visuals, and heavy text overlays.
3. Match a modern tutorial UI style: light background, high contrast, clean iconography, simple shapes, restrained color palette.
4. Use minimal embedded text. Prefer labels only where the diagram would be unclear without them.
5. The final SVG will be stored directly in tutorial section JSON, so keep file size practical and structure deterministic.
6. Each asset below must have a separate prompt.
7. The final answer must be plain text, organized asset by asset.

**OUTPUT FORMAT PER ASSET**
- Asset field path
- File name
- Size
- Visual objective
- Detailed SVG generation prompt
- Accessibility alt text

**ASSETS TO GENERATE**
\${assetsToGenerate.map((asset, index) => \`\${index + 1}. Field path: \${asset.fieldPath}
   File name: \${section}-\${asset.id}-\${subtopicSlug}-v1.svg
   Size: \${asset.width}x\${asset.height}
   Visual objective: \${asset.purpose}\`).join('\\n\\n')}

Write the asset prompt(s) now for "\${subtopicName}".\`;
  };`
);

// 4. Update generatePrompt to handle individual assets
content = content.replace(
  /const generatePrompt = \(\) => \{[\s\S]*?setGeneratedPrompt\(prompt\);[\s\S]*?const assetPrompt = getSvgAssetPromptForSection\([\s\S]*?\);[\s\S]*?setGeneratedAssetPrompt\(assetPrompt\);[\s\S]*?\};/,
  `const generatePrompt = (assetId?: string) => {
    if (!selectedSection) return;
    
    // If generating a specific asset, only update the asset prompt
    if (assetId) {
      const assetPrompt = getSvgAssetPromptForSection(
        selectedSection as TutorialPromptSectionId,
        domain,
        subject,
        topic,
        subtopic,
        assetId
      );
      setGeneratedAssetPrompt(assetPrompt);
      setSelectedAssetId(assetId);
      setAssetCopied(false);
      return;
    }

    // Otherwise generate both (default behavior)
    const prompt = getNotesPrompt(
      selectedSection as TutorialPromptSectionId,
      domain,
      subject,
      topic,
      subtopic
    );
    setGeneratedPrompt(prompt);
    setCopied(false);

    const assetPrompt = getSvgAssetPromptForSection(
      selectedSection as TutorialPromptSectionId,
      domain,
      subject,
      topic,
      subtopic
    );
    setGeneratedAssetPrompt(assetPrompt);
    setSelectedAssetId(null);
    setAssetCopied(false);
  };`
);

// 5. Update UI to include asset buttons
content = content.replace(
  /<button[\s\S]*?onClick=\{generatePrompt\}[\s\S]*?>[\s\S]*?Generate All Prompts[\s\S]*?<\/button>/,
  `<button
              onClick={() => generatePrompt()}
              className="w-full py-4 text-white text-xl font-black rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Generate Core JSON Prompt
            </button>

            {/* Asset Buttons Row */}
            {selectedSection && ASSET_SPECS[selectedSection] && (
              <div className="mt-8">
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
            )}`
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated prompt generator with sub-asset buttons.');
