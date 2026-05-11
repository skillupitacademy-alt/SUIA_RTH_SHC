'use client';

import React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { SimpleOverview } from './SimpleOverview';
import { AnalogyHero } from './AnalogyHero';
import { RealWorldScenario } from './RealWorldScenario';
import { ConceptComparison } from './ConceptComparison';
import { MistakeToAvoid } from './MistakeToAvoid';
import { KeyTakeawayPanel } from './KeyTakeawayPanel';
import { LaymanVisual } from './LaymanVisual';

interface LaymanModularRendererProps {
  data: any;
  themeColor: string;
}

export function LaymanModularRenderer({ data, themeColor }: LaymanModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

    // Dynamic Layout Support
  const layoutStyle = data.layout || {};
  const spacing = data.spacing || "2rem";

return (
    <div className="flex flex-col" style={{ gap: spacing, padding: layoutStyle.padding, margin: layoutStyle.margin, ...layoutStyle.customStyles }}>
      {data.analogyHero && <AnalogyHero data={data.analogyHero} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.simpleOverview && <SimpleOverview data={data.simpleOverview} themeColor={themeColor} />}
        {data.realWorldScenario && <RealWorldScenario data={data.realWorldScenario} themeColor={themeColor} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.conceptComparison && <ConceptComparison data={data.conceptComparison} themeColor={themeColor} />}
        {data.mistakeToAvoid && <MistakeToAvoid data={data.mistakeToAvoid} themeColor={themeColor} />}
      </div>

      {data.laymanVisual && <LaymanVisual data={data.laymanVisual} themeColor={themeColor} />}
      {data.keyTakeawayPanel && <KeyTakeawayPanel data={data.keyTakeawayPanel} themeColor={themeColor} />}
    </div>
  );
}
