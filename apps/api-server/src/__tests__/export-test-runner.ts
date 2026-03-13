import { ExportEngine } from '../lib/export/exportEngine';
import * as fs from 'fs';
import * as path from 'path';

// Mock put to local filesystem for verification
async function mockPut(filename: string, buffer: Buffer) {
    const tempDir = path.join(process.cwd(), 'tmp-exports');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const fullPath = path.join(tempDir, path.basename(filename));
    fs.writeFileSync(fullPath, buffer);
    return { url: `file://${fullPath}` };
}

// Override ExportEngine's upload logic or just use it as is if we can mock the module
// Since we can't easily mock modules in a simple script without a loader, 
// we will just run the logic manually or use a slightly modified version.

async function runTest() {
    console.log('🚀 Starting Analytical Export System Standalone Test...');
    
    // We need to provide a mock QueryBuilder and Aggregator to the engine 
    // because we don't have a live DB connection in this minimal runner.
    
    // For this test, we'll just verify the formatters directly since that's the complex part.
    const { JsonFormatter } = await import('../lib/export/formatters/jsonFormatter');
    const { CsvFormatter } = await import('../lib/export/formatters/csvFormatter');
    
    const payload: any = {
        meta: { candidateName: 'Test student', examTitle: 'Math', score: 90 },
        rawAttempts: [{ questionId: 'q1', isCorrect: true, timeSpentSeconds: 10 }],
        aggregations: { totalQuestions: 1, overallAccuracy: 100 },
        historicalProgress: [],
        guidanceSignals: []
    };

    console.log('--- Testing JSON Formatter ---');
    const jsonFormatter = new JsonFormatter();
    const jsonBuffer = jsonFormatter.format(payload);
    console.log('✅ JSON Buffer size:', jsonBuffer.length);

    console.log('--- Testing CSV Formatter (ZIP) ---');
    const csvFormatter = new CsvFormatter();
    const zipBuffer = await csvFormatter.formatAsZip(payload);
    console.log('✅ ZIP Buffer size:', zipBuffer.length);
    
    const tempZip = path.join(process.cwd(), 'test-export.zip');
    fs.writeFileSync(tempZip, zipBuffer);
    console.log('📦 ZIP saved to:', tempZip);
    
    console.log('✨ Standalone Test completed successfully!');
}

runTest().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
