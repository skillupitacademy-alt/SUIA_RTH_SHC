'use client';

import { type TutorialContentJSON } from '@quiz/types';
import React from 'react';

import { TechnicalDeepDive } from './TechnicalDeepDive';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { PerformanceMetrics } from './PerformanceMetrics';
import { SecurityAuditPanel } from './SecurityAuditPanel';
import { APISpecification } from './APISpecification';
import { AdvancedPatterns } from './AdvancedPatterns';
import { TechnicalFaq } from './TechnicalFaq';
import { TechnicalSummary } from './TechnicalSummary';
import { getLayoutStyle, pickSection, pickString, toRecord } from '../utils';

interface TechnicalModularRendererProps {
  data: NonNullable<TutorialContentJSON['technical']>;
  themeColor: string;
}

export function TechnicalModularRenderer({ data, themeColor }: TechnicalModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  const m = toRecord(data);

  // Map Schema Keys
  const deepDiveData = pickSection(m, ['technical_definition_block', 'coreTechnicalDefinition', 'deep_system_breakdown', 'deepSystemBreakdown']);
  const architectureData = pickSection(m, ['architecture_diagram_block', 'architectureWorkspace', 'interactive_architecture_workspace', 'interactiveArchitectureWorkspace']);
  const performanceData = pickSection(m, ['performance_analysis_panel', 'performanceTradeoffs', 'benchmark_dashboard', 'benchmarkDashboard']);
  const apiData = pickSection(m, ['tradeoff_matrix', 'api_specification', 'APISpecification']);
  const patternsData = pickSection(m, ['pattern_library', 'architecture_pattern_repository', 'architecturePatternRepository']);
  const auditData = pickSection(m, ['security_audit_panel', 'SecurityAuditPanel', 'real_world_scaling_dashboard', 'realWorldScalingDashboard']);
  const faqData = pickSection(m, ['enterprise_use_case_panel', 'TechnicalFaq', 'decision_framework_panel', 'decisionFrameworkPanel']);
  const summaryData = pickSection(m, ['technical_summary_card', 'TechnicalSummary', 'expert_revision_summary', 'expertRevisionSummary']);

    // Dynamic Layout Support
  const layoutStyle = getLayoutStyle(m);
  const spacing = pickString(m, 'spacing', '2rem');

return (
    <div className="flex flex-col" style={{ gap: spacing, ...layoutStyle }}>
      {deepDiveData && <TechnicalDeepDive data={deepDiveData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {architectureData && <ArchitectureDiagram data={architectureData} />}
        {performanceData && <PerformanceMetrics data={performanceData} />}
      </div>

      {apiData && <APISpecification data={apiData} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {auditData && <SecurityAuditPanel data={auditData} />}
        </div>
        <div className="flex flex-col gap-6">
          {patternsData && <AdvancedPatterns data={patternsData} />}
          {faqData && <TechnicalFaq data={faqData} />}
        </div>
      </div>

      {summaryData && <TechnicalSummary data={summaryData} />}
    </div>
  );
}
