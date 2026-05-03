#!/usr/bin/env node
/**
 * DELIVERABLE 2 - LEGACY CONTENT TRANSFORMATION
 * Phase 1: Comprehensive Legacy Content Audit
 * 
 * Purpose: Deep analysis of existing tutorial content for modular transformation
 * Scope: tutorial_topics, tutorial_subtopics, tutorial_content
 */

import { neon } from '@neondatabase/serverless';
import { writeFileSync } from 'fs';

const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;

if (!TUTORIAL_DB_URL) {
  console.error('❌ DATABASE_URL_TUTORIAL not found');
  process.exit(1);
}

const sql = neon(TUTORIAL_DB_URL);

async function auditLegacyContent() {
  console.log('🔍 DELIVERABLE 2 - PHASE 1: LEGACY CONTENT AUDIT');
  console.log('==========================================\n');

  const timestamp = new Date().toISOString();
  const audit = {
    timestamp,
    deliverable: 'DELIVERABLE_2',
    phase: 'PHASE_1_LEGACY_CONTENT_AUDIT',
    status: 'IN_PROGRESS',
    legacy: {
      topics: {},
      subtopics: {},
      content: {}
    },
    relationships: {},
    brandAnalysis: {},
    transformationOpportunities: {},
    risks: []
  };

  try {
    // ========================================
    // AUDIT 1: TUTORIAL TOPICS
    // ========================================
    console.log('📊 AUDIT 1: Tutorial Topics');
    console.log('------------------------------------------');

    const topics = await sql`
      SELECT 
        id,
        external_id,
        name,
        slug,
        subject_id,
        created_at,
        updated_at,
        deleted_at
      FROM tutorial_topics
      WHERE deleted_at IS NULL
      ORDER BY created_at;
    `;

    console.log(`Found ${topics.length} topics\n`);

    // Get subject mapping
    const subjects = await sql`
      SELECT id, name, domain_id
      FROM tutorial_subjects;
    `;

    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));

    // Get domain mapping
    const domains = await sql`
      SELECT id, name
      FROM tutorial_domains;
    `;

    const domainMap = Object.fromEntries(domains.map(d => [d.id, d]));

    topics.forEach(topic => {
      const subject = subjectMap[topic.subject_id];
      const domain = subject ? domainMap[subject.domain_id] : null;
      
      console.log(`  📚 ${topic.name}`);
      console.log(`     Subject: ${subject?.name || 'Unknown'}`);
      console.log(`     Domain: ${domain?.name || 'Unknown'}`);
      console.log(`     Slug: ${topic.slug}`);
    });

    audit.legacy.topics = {
      count: topics.length,
      topics: topics.map(t => ({
        id: t.id,
        externalId: t.external_id,
        name: t.name,
        slug: t.slug,
        subjectId: t.subject_id,
        subjectName: subjectMap[t.subject_id]?.name,
        domainId: subjectMap[t.subject_id]?.domain_id,
        domainName: domainMap[subjectMap[t.subject_id]?.domain_id]?.name,
        createdAt: t.created_at,
        updatedAt: t.updated_at
      }))
    };

    // ========================================
    // AUDIT 2: TUTORIAL SUBTOPICS
    // ========================================
    console.log('\n📊 AUDIT 2: Tutorial Subtopics');
    console.log('------------------------------------------');

    const subtopics = await sql`
      SELECT 
        id,
        external_id,
        name,
        slug,
        topic_id,
        difficulty_levels,
        created_at,
        updated_at,
        deleted_at
      FROM tutorial_subtopics
      WHERE deleted_at IS NULL
      ORDER BY topic_id, created_at;
    `;

    console.log(`Found ${subtopics.length} subtopics\n`);

    const topicMap = Object.fromEntries(topics.map(t => [t.id, t]));

    // Group by topic
    const subtopicsByTopic = {};
    subtopics.forEach(subtopic => {
      const topicId = subtopic.topic_id;
      if (!subtopicsByTopic[topicId]) {
        subtopicsByTopic[topicId] = [];
      }
      subtopicsByTopic[topicId].push(subtopic);
    });

    Object.entries(subtopicsByTopic).forEach(([topicId, subs]) => {
      const topic = topicMap[topicId];
      console.log(`  📖 ${topic?.name || 'Unknown Topic'} (${subs.length} subtopics)`);
      subs.forEach(sub => {
        const difficultyLevels = Array.isArray(sub.difficulty_levels) ? sub.difficulty_levels.join(', ') : 'N/A';
        console.log(`     • ${sub.name} [${difficultyLevels}]`);
      });
    });

    audit.legacy.subtopics = {
      count: subtopics.length,
      byTopic: Object.fromEntries(
        Object.entries(subtopicsByTopic).map(([topicId, subs]) => [
          topicId,
          {
            topicName: topicMap[topicId]?.name,
            count: subs.length,
            subtopics: subs.map(s => ({
              id: s.id,
              externalId: s.external_id,
              name: s.name,
              slug: s.slug,
              difficultyLevels: s.difficulty_levels,
              createdAt: s.created_at,
              updatedAt: s.updated_at
            }))
          }
        ])
      )
    };

    // ========================================
    // AUDIT 3: TUTORIAL CONTENT
    // ========================================
    console.log('\n📊 AUDIT 3: Tutorial Content');
    console.log('------------------------------------------');

    const content = await sql`
      SELECT 
        id,
        subtopic_id,
        difficulty,
        content_type,
        content,
        version,
        language,
        is_published,
        generated_by_ai,
        ai_model_used,
        quality_score,
        regeneration_count,
        created_at,
        updated_at,
        deleted_at
      FROM tutorial_content
      WHERE deleted_at IS NULL
      ORDER BY subtopic_id, created_at;
    `;

    console.log(`Found ${content.length} content items\n`);

    // Group by subtopic
    const contentBySubtopic = {};
    content.forEach(item => {
      const subtopicId = item.subtopic_id;
      if (!contentBySubtopic[subtopicId]) {
        contentBySubtopic[subtopicId] = [];
      }
      contentBySubtopic[subtopicId].push(item);
    });

    const subtopicMap = Object.fromEntries(subtopics.map(s => [s.id, s]));

    Object.entries(contentBySubtopic).forEach(([subtopicId, items]) => {
      const subtopic = subtopicMap[subtopicId];
      const topic = topicMap[subtopic?.topic_id];
      console.log(`  📄 ${topic?.name || 'Unknown'} > ${subtopic?.name || 'Unknown'} (${items.length} items)`);
      items.forEach(item => {
        const contentSize = JSON.stringify(item.content).length;
        const aiFlag = item.generated_by_ai ? '🤖' : '👤';
        console.log(`     • ${item.content_type} [${item.difficulty}] ${aiFlag} [${item.is_published ? 'Published' : 'Draft'}] (${contentSize} bytes)`);
      });
    });

    // Analyze content types
    const contentTypeDistribution = {};
    const difficultyDistribution = {};
    const aiGeneratedCount = content.filter(c => c.generated_by_ai).length;
    
    content.forEach(item => {
      const type = item.content_type || 'unknown';
      contentTypeDistribution[type] = (contentTypeDistribution[type] || 0) + 1;
      
      const difficulty = item.difficulty || 'unknown';
      difficultyDistribution[difficulty] = (difficultyDistribution[difficulty] || 0) + 1;
    });

    console.log('\n  Content Type Distribution:');
    Object.entries(contentTypeDistribution).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });

    console.log('\n  Difficulty Distribution:');
    Object.entries(difficultyDistribution).forEach(([diff, count]) => {
      console.log(`     ${diff}: ${count}`);
    });

    console.log(`\n  AI Generated: ${aiGeneratedCount}/${content.length} (${Math.round(aiGeneratedCount/content.length*100)}%)`);

    audit.legacy.content = {
      count: content.length,
      publishedCount: content.filter(c => c.is_published).length,
      draftCount: content.filter(c => !c.is_published).length,
      aiGeneratedCount,
      aiGeneratedPercentage: Math.round(aiGeneratedCount/content.length*100),
      contentTypeDistribution,
      difficultyDistribution,
      bySubtopic: Object.fromEntries(
        Object.entries(contentBySubtopic).map(([subtopicId, items]) => [
          subtopicId,
          {
            subtopicName: subtopicMap[subtopicId]?.name,
            topicName: topicMap[subtopicMap[subtopicId]?.topic_id]?.name,
            count: items.length,
            items: items.map(i => ({
              id: i.id,
              contentType: i.content_type,
              difficulty: i.difficulty,
              isPublished: i.is_published,
              generatedByAi: i.generated_by_ai,
              aiModelUsed: i.ai_model_used,
              version: i.version,
              language: i.language,
              regenerationCount: i.regeneration_count,
              contentSize: JSON.stringify(i.content).length,
              createdAt: i.created_at,
              updatedAt: i.updated_at
            }))
          }
        ])
      )
    };

    // ========================================
    // AUDIT 4: RELATIONSHIP ANALYSIS
    // ========================================
    console.log('\n📊 AUDIT 4: Relationship Analysis');
    console.log('------------------------------------------');

    const orphanedSubtopics = subtopics.filter(s => !topicMap[s.topic_id]);
    const orphanedContent = content.filter(c => !subtopicMap[c.subtopic_id]);
    const emptySubtopics = subtopics.filter(s => !contentBySubtopic[s.id] || contentBySubtopic[s.id].length === 0);
    const emptyTopics = topics.filter(t => !subtopicsByTopic[t.id] || subtopicsByTopic[t.id].length === 0);

    console.log(`  Orphaned Subtopics: ${orphanedSubtopics.length}`);
    console.log(`  Orphaned Content: ${orphanedContent.length}`);
    console.log(`  Empty Subtopics: ${emptySubtopics.length}`);
    console.log(`  Empty Topics: ${emptyTopics.length}`);

    audit.relationships = {
      orphanedSubtopics: orphanedSubtopics.length,
      orphanedContent: orphanedContent.length,
      emptySubtopics: emptySubtopics.length,
      emptyTopics: emptyTopics.length,
      healthScore: Math.round(
        ((subtopics.length - orphanedSubtopics.length - emptySubtopics.length) / subtopics.length) * 100
      )
    };

    // ========================================
    // AUDIT 5: BRAND ANALYSIS
    // ========================================
    console.log('\n📊 AUDIT 5: Brand Analysis');
    console.log('------------------------------------------');

    // Check if there's any brand-specific data
    const domainBrandMapping = await sql`
      SELECT id, name
      FROM tutorial_domains;
    `;

    console.log(`  Domains: ${domainBrandMapping.length}`);
    domainBrandMapping.forEach(d => {
      console.log(`     • ${d.name}`);
    });

    // Infer brand from domain names
    const brandInference = {
      realtutorialhub: 0,
      skillup: 0,
      shared: 0
    };

    domainBrandMapping.forEach(domain => {
      const name = domain.name.toLowerCase();
      if (name.includes('skillup') || name.includes('skill')) {
        brandInference.skillup++;
      } else if (name.includes('real') || name.includes('tutorial')) {
        brandInference.realtutorialhub++;
      } else {
        brandInference.shared++;
      }
    });

    console.log('\n  Brand Inference (from domain names):');
    console.log(`     RealTutorialHub: ${brandInference.realtutorialhub}`);
    console.log(`     SkillUp: ${brandInference.skillup}`);
    console.log(`     Shared: ${brandInference.shared}`);

    audit.brandAnalysis = {
      totalDomains: domainBrandMapping.length,
      domains: domainBrandMapping.map(d => d.name),
      brandInference,
      recommendation: 'All legacy content should default to "shared" brand unless explicitly branded'
    };

    // ========================================
    // AUDIT 6: TRANSFORMATION OPPORTUNITIES
    // ========================================
    console.log('\n📊 AUDIT 6: Transformation Opportunities');
    console.log('------------------------------------------');

    const opportunities = {
      constitutionalSectionMapping: {
        description: 'Map legacy content into 12 constitutional sections',
        complexity: 'HIGH',
        approach: 'AI-assisted content analysis + manual review',
        estimatedEffort: 'Medium'
      },
      subsectionTaxonomy: {
        description: 'Classify content into 24 subsection types',
        complexity: 'MEDIUM',
        approach: 'Content type analysis + semantic classification',
        estimatedEffort: 'Medium'
      },
      brandPartitioning: {
        description: 'Assign brand ownership to all content',
        complexity: 'LOW',
        approach: 'Domain-based inference + default to shared',
        estimatedEffort: 'Low'
      },
      aiPromptGeneration: {
        description: 'Generate prompt templates for existing content patterns',
        complexity: 'HIGH',
        approach: 'Content pattern analysis + template synthesis',
        estimatedEffort: 'High'
      },
      educationalArchitecture: {
        description: 'Define learning patterns from existing content',
        complexity: 'MEDIUM',
        approach: 'Difficulty + time analysis + pedagogical mapping',
        estimatedEffort: 'Medium'
      },
      uiArchitecture: {
        description: 'Extract UI patterns from content types',
        complexity: 'LOW',
        approach: 'Content type → component mapping',
        estimatedEffort: 'Low'
      }
    };

    console.log('  Identified Opportunities:');
    Object.entries(opportunities).forEach(([key, opp]) => {
      console.log(`\n  ${key}:`);
      console.log(`     ${opp.description}`);
      console.log(`     Complexity: ${opp.complexity}`);
      console.log(`     Approach: ${opp.approach}`);
      console.log(`     Effort: ${opp.estimatedEffort}`);
    });

    audit.transformationOpportunities = opportunities;

    // ========================================
    // AUDIT 7: RISK ANALYSIS
    // ========================================
    console.log('\n📊 AUDIT 7: Risk Analysis');
    console.log('------------------------------------------');

    const risks = [];

    if (orphanedSubtopics.length > 0) {
      risks.push({
        severity: 'MEDIUM',
        category: 'DATA_INTEGRITY',
        description: `${orphanedSubtopics.length} orphaned subtopics without parent topics`,
        mitigation: 'Create placeholder topics or reassign to existing topics'
      });
    }

    if (orphanedContent.length > 0) {
      risks.push({
        severity: 'HIGH',
        category: 'DATA_INTEGRITY',
        description: `${orphanedContent.length} orphaned content items without parent subtopics`,
        mitigation: 'Create placeholder subtopics or reassign to existing subtopics'
      });
    }

    if (emptySubtopics.length > 0) {
      risks.push({
        severity: 'LOW',
        category: 'CONTENT_QUALITY',
        description: `${emptySubtopics.length} subtopics without content`,
        mitigation: 'Mark for content creation or deprecation'
      });
    }

    if (content.filter(c => !c.is_published).length > 0) {
      risks.push({
        severity: 'LOW',
        category: 'CONTENT_QUALITY',
        description: `${content.filter(c => !c.is_published).length} draft content items`,
        mitigation: 'Review and publish or archive'
      });
    }

    risks.push({
      severity: 'HIGH',
      category: 'TRANSFORMATION',
      description: 'No existing brand attribution in legacy content',
      mitigation: 'Default all content to "shared" brand, allow manual override'
    });

    risks.push({
      severity: 'MEDIUM',
      category: 'TRANSFORMATION',
      description: 'Legacy content lacks constitutional section structure',
      mitigation: 'Use AI-assisted content analysis to infer section types'
    });

    risks.push({
      severity: 'MEDIUM',
      category: 'SEO',
      description: 'URL structure may change during transformation',
      mitigation: 'Maintain legacy URL redirects, preserve slug patterns'
    });

    console.log('  Identified Risks:');
    risks.forEach((risk, i) => {
      console.log(`\n  ${i + 1}. [${risk.severity}] ${risk.category}`);
      console.log(`     ${risk.description}`);
      console.log(`     Mitigation: ${risk.mitigation}`);
    });

    audit.risks = risks;

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n==========================================');
    console.log('📊 AUDIT SUMMARY');
    console.log('==========================================\n');

    console.log(`Total Topics: ${topics.length}`);
    console.log(`Total Subtopics: ${subtopics.length}`);
    console.log(`Total Content Items: ${content.length}`);
    console.log(`Published Content: ${content.filter(c => c.is_published).length}`);
    console.log(`Draft Content: ${content.filter(c => !c.is_published).length}`);
    console.log(`\nRelationship Health: ${audit.relationships.healthScore}%`);
    console.log(`Identified Risks: ${risks.length}`);
    console.log(`Transformation Opportunities: ${Object.keys(opportunities).length}`);

    audit.status = 'SUCCESS';
    audit.summary = {
      totalTopics: topics.length,
      totalSubtopics: subtopics.length,
      totalContent: content.length,
      publishedContent: content.filter(c => c.is_published).length,
      draftContent: content.filter(c => !c.is_published).length,
      relationshipHealth: audit.relationships.healthScore,
      riskCount: risks.length,
      opportunityCount: Object.keys(opportunities).length
    };

    // Save audit report
    const reportPath = `scripts/transformation/reports/legacy-content-audit-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(audit, null, 2));
    console.log(`\n📄 Audit report saved: ${reportPath}`);

    return audit;

  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    audit.status = 'FAILED';
    audit.error = error.message;
    
    const reportPath = `scripts/transformation/reports/legacy-content-audit-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(audit, null, 2));
    
    throw error;
  }
}

// Execute
auditLegacyContent()
  .then(() => {
    console.log('\n✅ Legacy content audit complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Legacy content audit failed:', error);
    process.exit(1);
  });
