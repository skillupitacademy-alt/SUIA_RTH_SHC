import { AdminEngine } from './apps/api-server/src/modules/admin-engine/admin.engine';

async function main() {
  try {
    console.log('--- STARTING CONTENT HEALTH AUDIT ---');
    const report = await AdminEngine.getContentHealthReport();
    
    report.forEach(domain => {
      console.log(`\nDomain: ${domain.domainName} (${domain.isReady ? 'READY 🟢' : 'ACTION REQUIRED 🔴'})`);
      console.log(`- Questions: ${domain.stats.total} (Simple: ${domain.stats.simple}, Inter: ${domain.stats.intermediate}, Expert: ${domain.stats.expert})`);
      console.log(`- Has Blueprint: ${domain.hasBlueprint ? 'YES' : 'NO'}`);
      
      domain.subjects.forEach(subject => {
        const isSubjectReady = subject.topics.every(t => t.stats.isReady);
        console.log(`  └ Subject: ${subject.name} (${isSubjectReady ? '🟢' : '🔴'})`);
        
        subject.topics.forEach(topic => {
          console.log(`    └ Topic: ${topic.name} (${topic.stats.isReady ? '🟢' : '🔴'})`);
          console.log(`      - Total: ${topic.stats.total} [S: ${topic.stats.simple}, I: ${topic.stats.intermediate}, E: ${topic.stats.expert}]`);
          if (!topic.stats.isReady) {
            console.log(`      - MISSING: S: ${topic.stats.missing.simple}, I: ${topic.stats.missing.intermediate}, E: ${topic.stats.missing.expert}`);
          }
        });
      });
    });
    console.log('\n--- AUDIT COMPLETE ---');
  } catch (error) {
    console.error('Audit failed:', error);
  }
}

main();
