'use client';

import React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { CoreDefinition } from './CoreDefinition';
import { SystemMechanics } from './SystemMechanics';
import { SyntaxStructure } from './SyntaxStructure';
import { KeyComponents } from './KeyComponents';
import { BestPractices } from './BestPractices';
import { CommonMistakes } from './CommonMistakes';
import { VisualSummary } from './VisualSummary';
import { NotesHero } from './NotesHero';

interface NotesModularRendererProps {
  data: any;
  themeColor: string;
}

export function NotesModularRenderer({ data, themeColor }: NotesModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  // Map Schema Keys
  const definitionData = data.definition_block || data.coreDefinition;
  const mechanicsData = data.component_grid || data.keyComponents;
  const syntaxData = data.syntax_block || data.syntaxStructure;
  const exampleData = data.example_panel || data.examples;
  const bestPracticeData = data.practice_card || data.bestPractices;
  const errorData = data.warning_faq || data.commonErrors;
  const summaryData = data.summary_card || data.revisionSummary;
  const heroData = data.concept_card || data.conceptExplanation;

  // Dynamic Layout Support
  const layoutStyle = data.layout || {};
  const spacing = data.spacing || '2rem'; // Default gap

  return (
    <div 
      className="flex flex-col" 
      style={{ 
        gap: spacing,
        padding: layoutStyle.padding,
        margin: layoutStyle.margin,
        ...layoutStyle.customStyles
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
          {errorData && <CommonMistakes data={errorData} themeColor={themeColor} />}
        </div>
      </div>

      {summaryData && <VisualSummary data={summaryData} themeColor={themeColor} />}
    </div>
  );
}
