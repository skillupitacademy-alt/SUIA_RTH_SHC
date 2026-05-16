import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/content-manager/add-section/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

const oldBlock = `    return {
      simpleWords: asString(content.simpleWords, asString(definitionBlock.definitionText, subtopicName)),
      definitionBlock: {
        ...definitionBlock,
        quickSummary: asArray(definitionBlock.quickSummary),
      },
      sections: asArray(content.sections),
      componentGrid: {
        ...componentGrid,
        componentCards: asArray(componentGrid.componentCards),
      },
      examplePanel: {
        ...examplePanel,
        scenarios: asArray(examplePanel.scenarios),
      },
      practiceCard: {
        ...practiceCard,
        recommendations: asArray(practiceCard.recommendations),
        optimizationTips: asArray(practiceCard.optimizationTips),
        industryStandards: asArray(practiceCard.industryStandards),
      },
      warningFaq: {
        ...warningFaq,
        commonErrors: asArray(warningFaq.commonErrors),
        faqItems: asArray(warningFaq.faqItems),
        misconceptionAlerts: asArray(warningFaq.misconceptionAlerts),
      },
      summaryCard: {
        ...summaryCard,
        keyTakeaways: asArray(summaryCard.keyTakeaways),
        revisionChecklist: asArray(summaryCard.revisionChecklist),
        examTips: asArray(summaryCard.examTips),
        ...(normalizeSvgAsset(summaryCard.image) ? { image: normalizeSvgAsset(summaryCard.image) } : {}),
      },
    };`;

const newBlock = `    return {
      simpleWords: asString(content.simpleWords, asString(definitionBlock.definitionText, subtopicName)),
      summaryHeroInfographic: isRecord(content.summaryHeroInfographic) ? {
        ...asRecord(content.summaryHeroInfographic),
        ...(normalizeSvgAsset(asRecord(content.summaryHeroInfographic).image) ? { image: normalizeSvgAsset(asRecord(content.summaryHeroInfographic).image) } : {})
      } : undefined,
      conceptMemoryMap: isRecord(content.conceptMemoryMap) ? asRecord(content.conceptMemoryMap) : undefined,
      cheatSheetSVG: isRecord(content.cheatSheetSVG) ? asRecord(content.cheatSheetSVG) : undefined,
      definitionBlock: {
        ...definitionBlock,
        quickSummary: asArray(definitionBlock.quickSummary),
      },
      sections: asArray(content.sections),
      componentGrid: {
        ...componentGrid,
        componentCards: asArray(componentGrid.componentCards),
      },
      syntaxBlock: isRecord(content.syntaxBlock) ? asRecord(content.syntaxBlock) : undefined,
      examplePanel: {
        ...examplePanel,
        scenarios: asArray(examplePanel.scenarios),
      },
      practiceCard: {
        ...practiceCard,
        recommendations: asArray(practiceCard.recommendations),
        optimizationTips: asArray(practiceCard.optimizationTips),
        industryStandards: asArray(practiceCard.industryStandards),
      },
      warningFaq: {
        ...warningFaq,
        commonErrors: asArray(warningFaq.commonErrors),
        faqItems: asArray(warningFaq.faqItems),
        misconceptionAlerts: asArray(warningFaq.misconceptionAlerts),
      },
      summaryCard: {
        ...summaryCard,
        keyTakeaways: asArray(summaryCard.keyTakeaways),
        revisionChecklist: asArray(summaryCard.revisionChecklist),
        examTips: asArray(summaryCard.examTips),
        ...(normalizeSvgAsset(summaryCard.image) ? { image: normalizeSvgAsset(summaryCard.image) } : {}),
      },
      footerBlock: isRecord(content.footerBlock) ? asRecord(content.footerBlock) : undefined,
    };`;

// Try direct replacement first
if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(filePath, content);
    console.log('Direct replacement successful');
} else {
    console.log('Direct replacement failed, trying line-by-line normalization');
    // Fallback: search by simpleWords line
    const lines = content.split('\n');
    let startIdx = -1;
    let endIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('simpleWords: asString(content.simpleWords, asString(definitionBlock.definitionText, subtopicName))') && lines[i-1].includes('return {')) {
            startIdx = i - 1;
            // Find closing brace of return object
            for (let j = i; j < lines.length; j++) {
                if (lines[j].trim() === '};' && lines[j+1]?.trim() === '}') {
                    endIdx = j;
                    break;
                }
            }
            break;
        }
    }
    
    if (startIdx !== -1 && endIdx !== -1) {
        lines.splice(startIdx, endIdx - startIdx + 1, newBlock);
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log(`Replaced lines ${startIdx + 1} to ${endIdx + 1} successfully`);
    } else {
        console.error('Could not find the target block even with line-by-line search');
        process.exit(1);
    }
}
