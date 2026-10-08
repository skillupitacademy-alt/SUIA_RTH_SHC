'use client';

import { type TutorialContentJSON } from '@quiz/types';
import React from 'react';

import { SimpleOverview } from './SimpleOverview';
import { AnalogyHero } from './AnalogyHero';
import { BeginnerBreakdown } from './BeginnerBreakdown';
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
  const overview = pickSection(m, ['simpleOverview']);
  const analogy = pickSection(m, ['everydayAnalogy', 'analogyHero', 'analogy_card']);
  const whyItExists = pickSection(m, ['whyItExists', 'realWorldScenario']);
  const useCases = pickSection(m, ['simpleUseCases', 'conceptComparison']);
  const breakdown = pickSection(m, ['beginnerBreakdown']);
  const visual = pickSection(m, ['mentalModel', 'laymanVisual', 'mental_model']);
  const confusions = pickSection(m, ['commonConfusions', 'mistakeToAvoid', 'faq']);
  const takeaway = pickSection(m, ['simpleRecap', 'keyTakeawayPanel', 'summary']);

  return (
    <div className="flex flex-col" style={{ gap: spacing, ...layoutStyle }}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {overview && <SimpleOverview data={overview} themeColor={themeColor} sectionNumber={1} />}
        {analogy && <AnalogyHero data={analogy} themeColor={themeColor} sectionNumber={2} />}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {whyItExists && <RealWorldScenario data={whyItExists} sectionNumber={3} />}
        {useCases && <ConceptComparison data={useCases} sectionNumber={4} />}
      </div>

      {breakdown && <BeginnerBreakdown data={breakdown} themeColor={themeColor} sectionNumber={5} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {visual && <LaymanVisual data={visual} sectionNumber={6} />}
        {confusions && <MistakeToAvoid data={confusions} sectionNumber={7} />}
      </div>

      {takeaway && <KeyTakeawayPanel data={takeaway} themeColor={themeColor} sectionNumber={8} />}
    </div>
  );
}
