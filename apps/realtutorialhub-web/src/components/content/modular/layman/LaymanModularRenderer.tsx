'use client';

import { type TutorialContentJSON } from '@quiz/types';
import React from 'react';

import { SimpleOverview } from './SimpleOverview';
import { AnalogyHero } from './AnalogyHero';
import { RealWorldScenario } from './RealWorldScenario';
import { ConceptComparison } from './ConceptComparison';
import { MistakeToAvoid } from './MistakeToAvoid';
import { KeyTakeawayPanel } from './KeyTakeawayPanel';
import { LaymanVisual } from './LaymanVisual';
import { getLayoutStyle, pickSection, pickString, toRecord } from '../utils';

interface LaymanModularRendererProps {
  data: NonNullable<TutorialContentJSON['layman']>;
  themeColor: string;
}

export function LaymanModularRenderer({ data, themeColor }: LaymanModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  const m = toRecord(data);

  // Dynamic Layout Support
  const layoutStyle = getLayoutStyle(m);
  const spacing = pickString(m, 'spacing', '2rem');

  // Map schema keys
  const hero = pickSection(m, ['analogyHero', 'analogy_card', 'intro_card']);
  const overview = pickSection(m, ['simpleOverview', 'beginner_breakdown', 'mental_model']);
  const scenario = pickSection(m, ['realWorldScenario', 'use_case']);
  const comparison = pickSection(m, ['conceptComparison', 'faq']);
  const mistake = pickSection(m, ['mistakeToAvoid', 'summary']);
  const visual = pickSection(m, ['laymanVisual', 'mental_model']);
  const takeaway = pickSection(m, ['keyTakeawayPanel', 'summary']);

  return (
    <div className="flex flex-col" style={{ gap: spacing, ...layoutStyle }}>
      {hero && <AnalogyHero data={hero} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {overview && <SimpleOverview data={overview} themeColor={themeColor} />}
        {scenario && <RealWorldScenario data={scenario} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {comparison && <ConceptComparison data={comparison} />}
        {mistake && <MistakeToAvoid data={mistake} />}
      </div>

      {visual && <LaymanVisual data={visual} />}
      {takeaway && <KeyTakeawayPanel data={takeaway} />}
    </div>
  );
}
