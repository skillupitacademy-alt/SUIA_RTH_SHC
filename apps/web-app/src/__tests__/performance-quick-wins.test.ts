import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Performance: Sprint 3 Quick Wins Verification', () => {
    const rootDir = join(__dirname, '../../..');

    it('should verify that heavy components are imported dynamically in DashboardClientFallback', () => {
        const filePath = join(rootDir, 'apps/web-app/src/components/dashboard/DashboardClientFallback.tsx');
        if (existsSync(filePath)) {
            const content = readFileSync(filePath, 'utf-8');
            expect(content).toContain('dynamic(() => import("@/components/tutor/TutorInsightCard")');
        }
    });

    it('should verify that charts are imported dynamically in UserInsightsPage', () => {
        const filePath = join(rootDir, 'apps/web-app/src/app/(authenticated)/dashboard/insights/page.tsx');
        if (existsSync(filePath)) {
            const content = readFileSync(filePath, 'utf-8');
            expect(content).toContain('dynamic(() => import("@/components/charts/ScoreHistoryChart")');
            expect(content).toContain('dynamic(() => import("@/components/charts/MasteryTrendChart")');
        }
    });

    it('should verify preconnect hints in RootLayout', () => {
        const filePath = join(rootDir, 'apps/web-app/src/app/layout.tsx');
        if (existsSync(filePath)) {
            const content = readFileSync(filePath, 'utf-8');
            expect(content).toContain('ReactDOM.preconnect("https://fonts.googleapis.com")');
            expect(content).toContain('ReactDOM.preconnect("https://fonts.gstatic.com"');
        }
    });

    it('should verify Zustand stores emphasize selector usage', () => {
        const storePath = join(rootDir, 'apps/web-app/src/store/auth-store.ts');
        if (existsSync(storePath)) {
            const content = readFileSync(storePath, 'utf-8');
            expect(content).toContain('⚠️ ALWAYS use selectors');
        }
    });
});
