
import { AdminEngine } from '../apps/api-server/src/modules/admin-engine/admin.engine';
import { TrendsService } from '../apps/api-server/src/modules/metrics/trends.service';

// Mock DB connection if necessary, but we want to test the actual query generation if possible.
// Actually, we need to run this in context where 'db' works. 
// Assuming the user has env vars set or we can load them.

async function main() {
    try {
        console.log('Testing TrendsService.getDomainDeltas...');
        const domainDeltas = await TrendsService.getDomainDeltas('7d');
        console.log('Domain Deltas:', domainDeltas);

        console.log('Testing TrendsService.getPeriodDelta...');
        const periodDelta = await TrendsService.getPeriodDelta(undefined, '7d');
        console.log('Period Delta:', periodDelta);

        console.log('Testing TrendsService.getTrendSummary...');
        const trendSummary = await TrendsService.getTrendSummary({ range: '7d' });
        console.log('Trend Summary:', trendSummary);

        console.log('Testing AdminEngine.getPerformanceAnalytics...');
        const analytics = await AdminEngine.getPerformanceAnalytics();
        console.log('Analytics Success:', !!analytics);
    } catch (error) {
        console.error('ERROR CAUGHT:', error);
    }
}

main();
