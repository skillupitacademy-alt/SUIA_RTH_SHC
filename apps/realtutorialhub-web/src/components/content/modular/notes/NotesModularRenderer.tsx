'use client';

import { type TutorialContentJSON } from '@quiz/types';
import React from 'react';

import { CoreDefinition } from './CoreDefinition';
import { SystemMechanics } from './SystemMechanics';
import { SyntaxStructure } from './SyntaxStructure';
import { KeyComponents } from './KeyComponents';
import { BestPractices } from './BestPractices';
import { CommonMistakes } from './CommonMistakes';
import { VisualSummary } from './VisualSummary';
import { NotesHero } from './NotesHero';
import { getLayoutStyle, pickSection, pickString, toRecord } from '../utils';

interface NotesModularRendererProps {
  data: NonNullable<TutorialContentJSON['notes']>;
  themeColor: string;
}

export function NotesModularRenderer({ data, themeColor }: NotesModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  const m = toRecord(data);

  // Canonical Notes schema keys. Do not add aliases here; invalid keys should fail validation instead of rendering silently.
  const definitionData = pickSection(m, ['definition_block']);
  const mechanicsData = pickSection(m, ['component_grid']);
  const syntaxData = pickSection(m, ['syntax_block']);
  const exampleData = pickSection(m, ['example_panel']);
  const bestPracticeData = pickSection(m, ['practice_card']);
  const errorData = pickSection(m, ['warning_faq']);
  const summaryData = pickSection(m, ['summary_card']);
  const heroData = pickSection(m, ['concept_card']);

  // Dynamic Layout Support
  const layoutStyle = getLayoutStyle(m);
  const spacing = pickString(m, 'spacing', '2rem');

  return (
    <div 
      className="flex flex-col" 
      style={{ 
        gap: spacing,
        ...layoutStyle
      }}
    >
      {heroData && <NotesHero data={heroData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {definitionData && <CoreDefinition data={definitionData} themeColor={themeColor} />}
        {mechanicsData && <SystemMechanics data={mechanicsData} themeColor={themeColor} />}
      </div>

      {syntaxData && <SyntaxStructure data={syntaxData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {exampleData && <KeyComponents data={exampleData} themeColor={themeColor} />}
        </div>
        <div className="flex flex-col gap-6">
          {bestPracticeData && <BestPractices data={bestPracticeData} themeColor={themeColor} />}
          {errorData && <CommonMistakes data={errorData} />}
        </div>
      </div>

      {summaryData && <VisualSummary data={summaryData} themeColor={themeColor} />}
    </div>
  );
}
