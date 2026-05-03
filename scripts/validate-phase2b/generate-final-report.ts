/**
 * Final Report Generator
 * =======================
 * Generates comprehensive deployment readiness report
 */

interface ValidationResult {
  passed: boolean;
  score: number;
  tests: number;
  failures: number;
  warnings: string[];
  errors: string[];
  duration: number;
}

interface ValidationResults {
  infrastructure: ValidationResult;
  api: ValidationResult;
  governance: ValidationResult;
  security: ValidationResult;
  performance: ValidationResult;
}

interface FinalReport {
  summary: string;
  overallScore: number;
  productionReady: boolean;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
}

export function generateFinalReport(
  results: ValidationResults,
  totalDuration: number
): FinalReport {
  const layers = [
    { name: 'Infrastructure', result: results.infrastructure, weight: 0.25, critical: true },
    { name: 'API', result: results.api, weight: 0.25, critical: true },
    { name: 'Governance', result: results.governance, weight: 0.20, critical: false },
    { name: 'Security', result: results.security, weight: 0.20, critical: true },
    { name: 'Performance', result: results.performance, weight: 0.10, critical: false },
  ];

  // Calculate weighted overall score
  const overallScore = Math.round(
    layers.reduce((sum, layer) => {
      return sum + (layer.result.score * layer.weight);
    }, 0)
  );

  // Collect critical issues
  const criticalIssues: string[] = [];
  layers.forEach(layer => {
    if (layer.critical && !layer.result.passed) {
      criticalIssues.push(`${layer.name}: ${layer.result.errors.join(', ')}`);
    }
  });

  // Collect all warnings
  const allWarnings: string[] = [];
  layers.forEach(layer => {
    layer.result.warnings.forEach(w => {
      allWarnings.push(`[${layer.name}] ${w}`);
    });
  });

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (results.infrastructure.score < 100) {
    recommendations.push('Review infrastructure configuration and ensure all services are operational');
  }
  
  if (results.api.score < 90) {
    recommendations.push('Review API endpoint implementations and error handling');
  }
  
  if (results.governance.score < 90) {
    recommendations.push('Verify governance workflows and audit logging are functioning correctly');
  }
  
  if (results.security.score < 95) {
    recommendations.push('Address security vulnerabilities before production deployment');
  }
  
  if (results.performance.score < 85) {
    recommendations.push('Optimize performance bottlenecks for better user experience');
  }

  // Determine production readiness
  const productionReady = 
    criticalIssues.length === 0 &&
    overallScore >= 95 &&
    results.infrastructure.passed &&
    results.api.passed &&
    results.security.passed;

  // Generate summary text
  const summary = generateSummaryText(layers, overallScore, productionReady, totalDuration);

  return {
    summary,
    overallScore,
    productionReady,
    criticalIssues,
    warnings: allWarnings,
    recommendations,
  };
}

function generateSummaryText(
  layers: Array<{ name: string; result: ValidationResult; weight: number; critical: boolean }>,
  overallScore: number,
  productionReady: boolean,
  totalDuration: number
): string {
  const lines: string[] = [];

  lines.push('='.repeat(64));
  lines.push('PHASE 2B DEPLOYMENT VALIDATION REPORT');
  lines.push('='.repeat(64));
  lines.push('');

  // Layer results
  layers.forEach(layer => {
    const status = layer.result.passed ? '[PASS]' : '[FAIL]';
    const scoreIndicator = layer.result.score >= 90 ? '[GOOD]' : layer.result.score >= 70 ? '[OK]' : '[BAD]';
    const critical = layer.critical ? ' [CRITICAL]' : '';
    
    lines.push(`${status} ${layer.name}:${critical}`);
    lines.push(`   Score: ${scoreIndicator} ${layer.result.score}/100`);
    lines.push(`   Tests: ${layer.result.tests}, Failures: ${layer.result.failures}, Duration: ${layer.result.duration}ms`);
    
    if (layer.result.errors.length > 0) {
      lines.push(`   Errors: ${layer.result.errors.length}`);
      layer.result.errors.slice(0, 2).forEach(e => {
        lines.push(`      [FAIL] ${e}`);
      });
    }
    
    if (layer.result.warnings.length > 0) {
      lines.push(`   Warnings: ${layer.result.warnings.length}`);
      layer.result.warnings.slice(0, 2).forEach(w => {
        lines.push(`      [WARNING] ${w}`);
      });
    }
    
    lines.push('');
  });

  lines.push('-'.repeat(64));
  lines.push('');

  // Overall metrics
  const totalTests = layers.reduce((sum, l) => sum + l.result.tests, 0);
  const totalFailures = layers.reduce((sum, l) => sum + l.result.failures, 0);
  const passRate = totalTests > 0 
    ? Math.round(((totalTests - totalFailures) / totalTests) * 100)
    : 0;

  lines.push(`Overall Deployment Score:  ${overallScore}/100`);
  lines.push(`Total Tests Run:           ${totalTests}`);
  lines.push(`Total Failures:            ${totalFailures}`);
  lines.push(`Pass Rate:                 ${passRate}%`);
  lines.push(`Total Duration:            ${totalDuration}ms`);
  lines.push('');

  // Production status
  const statusIndicator = productionReady ? '[PASS]' : '[FAIL]';
  const statusText = productionReady ? 'APPROVED' : 'BLOCKED';
  lines.push(`Production Status:         ${statusIndicator} ${statusText}`);
  lines.push('');

  lines.push('='.repeat(64));

  return lines.join('\n');
}
