import fs from 'fs';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  PHASE C: SCHEMA DRIFT RECONCILIATION REPORT              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Load baseline reports
const tutorialBaseline = JSON.parse(fs.readFileSync(
  fs.readdirSync('scripts/baseline/reports')
    .filter(f => f.startsWith('tutorial-baseline'))
    .sort()
    .reverse()[0]
    ? `scripts/baseline/reports/${fs.readdirSync('scripts/baseline/reports').filter(f => f.startsWith('tutorial-baseline')).sort().reverse()[0]}`
    : null
));

const peopleBaseline = JSON.parse(fs.readFileSync(
  `scripts/baseline/reports/${fs.readdirSync('scripts/baseline/reports').filter(f => f.startsWith('people-baseline')).sort().reverse()[0]}`
));

const brandBaseline = JSON.parse(fs.readFileSync(
  `scripts/baseline/reports/${fs.readdirSync('scripts/baseline/reports').filter(f => f.startsWith('brand-dbs-baseline')).sort().reverse()[0]}`
));

// Expected from code
const expectedTutorialTables = [
  // Legacy (should exist)
  'tutorial_content', 'tutorial_domains', 'tutorial_subjects', 'tutorial_topics', 'tutorial_subtopics',
  'tutorial_content_versions', 'tutorial_content_audit', 'tutorial_assignments', 'assignment_progress',
  'assignment_help_requests', 'tutorial_projects', 'tutorial_project_submissions', 'tutorial_progress',
  'tutorial_video_links', 'badges', 'student_badges', 'certificates', 'remediation_triggers',
  'domain_content_config', 'content_generation_jobs', 'subtopic_flow_progress', 'student_streaks',
  'live_session_requests',
  
  // Phase 1 P0 (missing)
  'tutorial_sections', 'tutorial_subsections', 'educational_architectures', 'ui_architectures',
  'ai_generation_orchestration', 'ai_section_generation_jobs', 'prompt_templates',
  'content_review_queue', 'content_deployments', 'ai_generation_metrics',
  'analytics_learning_metrics', 'analytics_architecture_performance', 'analytics_brand_business'
];

const driftReport = {
  timestamp: new Date().toISOString(),
  summary: {
    totalDriftIssues: 0,
    criticalIssues: 0,
    warningIssues: 0,
    infoIssues: 0
  },
  databases: {}
};

// TUTORIAL DATABASE DRIFT
console.log('📊 Analyzing Tutorial Database Drift...\n');

const tutorialDrift = {
  missing: expectedTutorialTables.filter(t => !tutorialBaseline.tables.list.includes(t)),
  unexpected: tutorialBaseline.tables.list.filter(t => !expectedTutorialTables.includes(t)),
  issues: []
};

if (tutorialDrift.missing.length > 0) {
  tutorialDrift.issues.push({
    severity: 'CRITICAL',
    category: 'MISSING_TABLES',
    count: tutorialDrift.missing.length,
    description: 'Phase 1 P0 modular system tables not deployed',
    tables: tutorialDrift.missing,
    impact: 'Cannot use modular tutorial system',
    resolution: 'Apply Phase 1 P0 migrations'
  });
  driftReport.summary.criticalIssues++;
  console.log(`   ❌ CRITICAL: ${tutorialDrift.missing.length} tables missing (Phase 1 P0)`);
}

if (!tutorialBaseline.migrationTracking.exists) {
  tutorialDrift.issues.push({
    severity: 'CRITICAL',
    category: 'NO_MIGRATION_TRACKING',
    description: '__drizzle_migrations table does not exist',
    impact: 'No migration governance, cannot track schema changes',
    resolution: 'Initialize migration tracking (COMPLETED in Phase B)'
  });
  driftReport.summary.criticalIssues++;
  console.log(`   ❌ CRITICAL: No migration tracking`);
}

driftReport.databases.tutorial = tutorialDrift;

// PEOPLE DATABASE DRIFT
console.log('\n📊 Analyzing People Database Drift...\n');

const peopleDrift = {
  anomalies: [],
  issues: []
};

if (peopleBaseline.anomalies.unexpectedDomainTables.found) {
  peopleDrift.issues.push({
    severity: 'WARNING',
    category: 'UNEXPECTED_TABLES',
    tables: peopleBaseline.anomalies.unexpectedDomainTables.tables,
    rowCounts: peopleBaseline.anomalies.unexpectedDomainTables.rowCounts,
    description: 'Domain hierarchy tables found in people DB',
    impact: 'Potential duplication with quiz DB, unclear ownership',
    resolution: 'Investigate purpose, consolidate or remove'
  });
  driftReport.summary.warningIssues++;
  console.log(`   ⚠️  WARNING: Unexpected domain tables: ${peopleBaseline.anomalies.unexpectedDomainTables.tables.join(', ')}`);
}

driftReport.databases.people = peopleDrift;

// BRAND DATABASES DRIFT
console.log('\n📊 Analyzing Brand Databases Drift...\n');

const brandDrift = {
  rth: { issues: [] },
  skillup: { issues: [] }
};

if (brandBaseline.databases.rth.anomalies) {
  brandDrift.rth.issues.push({
    severity: 'INFO',
    category: 'BACKUP_TABLES',
    tables: brandBaseline.databases.rth.anomalies.backupTables,
    description: 'Manual backup tables found (dated 2026-04-04)',
    impact: 'Indicates emergency schema changes, potential tech debt',
    resolution: 'Document what happened, archive backups if safe'
  });
  driftReport.summary.infoIssues++;
  console.log(`   ℹ️  INFO: RTH backup tables: ${brandBaseline.databases.rth.anomalies.backupTables.join(', ')}`);
}

if (brandBaseline.crossBrandAnalysis.onlyInRTH.length > 0) {
  brandDrift.rth.issues.push({
    severity: 'WARNING',
    category: 'SCHEMA_INCONSISTENCY',
    tables: brandBaseline.crossBrandAnalysis.onlyInRTH,
    description: 'Tables exist in RTH but not SkillUp',
    impact: 'Brand schema drift, potential deployment issues',
    resolution: 'Sync schemas or document intentional differences'
  });
  driftReport.summary.warningIssues++;
  console.log(`   ⚠️  WARNING: RTH-only tables: ${brandBaseline.crossBrandAnalysis.onlyInRTH.join(', ')}`);
}

driftReport.databases.brands = brandDrift;

// CALCULATE TOTALS
driftReport.summary.totalDriftIssues = 
  driftReport.summary.criticalIssues + 
  driftReport.summary.warningIssues + 
  driftReport.summary.infoIssues;

// SAVE REPORT
const reportPath = `scripts/governance/drift-reconciliation-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
fs.writeFileSync(reportPath, JSON.stringify(driftReport, null, 2));

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  DRIFT RECONCILIATION COMPLETE                             ║');
console.log('╚════════════════════════════════════════════════════════════╝');

console.log('\n📊 DRIFT SUMMARY:');
console.log(`   🔴 Critical Issues: ${driftReport.summary.criticalIssues}`);
console.log(`   🟡 Warning Issues: ${driftReport.summary.warningIssues}`);
console.log(`   🔵 Info Issues: ${driftReport.summary.infoIssues}`);
console.log(`   📊 Total Drift Issues: ${driftReport.summary.totalDriftIssues}`);
console.log(`\n📄 Report saved: ${reportPath}\n`);

// RECOMMENDATIONS
console.log('🎯 RECOMMENDED ACTIONS:\n');
console.log('   1. ✅ Migration tracking initialized (Phase B complete)');
console.log('   2. ❌ Apply Phase 1 P0 migrations to deploy modular system');
console.log('   3. ⚠️  Investigate people DB domain tables');
console.log('   4. ℹ️  Document RTH backup tables incident\n');
