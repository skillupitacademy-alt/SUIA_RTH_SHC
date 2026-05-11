'use client';

import React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { TechnicalDeepDive } from './TechnicalDeepDive';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { PerformanceMetrics } from './PerformanceMetrics';
import { SecurityAuditPanel } from './SecurityAuditPanel';
import { APISpecification } from './APISpecification';
import { AdvancedPatterns } from './AdvancedPatterns';
import { TechnicalFaq } from './TechnicalFaq';
import { TechnicalSummary } from './TechnicalSummary';

interface TechnicalModularRendererProps {
  data: any; // Using any temporarily to avoid complex union extraction, as it's already guarded in TechnicalBlock
  themeColor: string;
}

export function TechnicalModularRenderer({ data, themeColor }: TechnicalModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  // Map Schema Keys
  const deepDiveData = data.technical_definition_block || data.coreTechnicalDefinition || data.deep_system_breakdown || data.deepSystemBreakdown;
  const architectureData = data.architecture_diagram_block || data.architectureWorkspace || data.interactive_architecture_workspace || data.interactiveArchitectureWorkspace;
  const performanceData = data.performance_analysis_panel || data.performanceTradeoffs || data.benchmark_dashboard || data.benchmarkDashboard;
  const apiData = data.tradeoff_matrix || data.api_specification || data.APISpecification;
  const patternsData = data.pattern_library || data.architecture_pattern_repository || data.architecturePatternRepository;
  const auditData = data.security_audit_panel || data.SecurityAuditPanel || data.real_world_scaling_dashboard || data.realWorldScalingDashboard;
  const faqData = data.enterprise_use_case_panel || data.TechnicalFaq || data.decision_framework_panel || data.decisionFrameworkPanel;
  const summaryData = data.technical_summary_card || data.TechnicalSummary || data.expert_revision_summary || data.expertRevisionSummary;

    // Dynamic Layout Support
  const layoutStyle = data.layout || {};
  const spacing = data.spacing || "2rem";

return (
    <div className="flex flex-col" style={{ gap: spacing, padding: layoutStyle.padding, margin: layoutStyle.margin, ...layoutStyle.customStyles }}>
      {deepDiveData && <TechnicalDeepDive data={deepDiveData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {architectureData && <ArchitectureDiagram data={architectureData} themeColor={themeColor} />}
        {performanceData && <PerformanceMetrics data={performanceData} themeColor={themeColor} />}
      </div>

      {apiData && <APISpecification data={apiData} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {auditData && <SecurityAuditPanel data={auditData} themeColor={themeColor} />}
        </div>
        <div className="flex flex-col gap-6">
          {patternsData && <AdvancedPatterns data={patternsData} themeColor={themeColor} />}
          {faqData && <TechnicalFaq data={faqData} themeColor={themeColor} />}
        </div>
      </div>

      {summaryData && <TechnicalSummary data={summaryData} themeColor={themeColor} />}
    </div>
  );
}
