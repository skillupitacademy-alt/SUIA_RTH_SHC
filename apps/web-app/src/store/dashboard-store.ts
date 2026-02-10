import { create } from 'zustand';
import { apiClient } from '@quiz/api-client';

interface DashboardData {
    overview: {
        avgScore: number;
        totalExams: number;
        masteryPoints: number;
        weeklyExamsCount: number;
        globalRank: number | null;
    };
    recentActivity: Array<{
        id: string;
        title: string;
        score: number | null;
        relativeTime: string;
        status: string;
    }>;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    performanceTrend: Array<{ score: number; date: string }>;
    deltaPct?: number | null;
    healthStatus?: 'green' | 'yellow' | 'red';
    drilldownMetadata?: {
        domains: Array<{ dimensionId: string; name: string }>;
        subjects: Array<{ dimensionId: string; name: string }>;
        topics: Array<{ dimensionId: string; name: string }>;
    };
    drilldownBreakdown?: Array<{ name: string; count: number; avgScore: number }>;
}

interface DashboardState {
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
    fetchDashboard: (range?: string, page?: number, limit?: number) => Promise<void>;
    fetchPerformanceTrend: (range?: string) => Promise<void>;
    fetchPerformanceBreakdownMetadata: () => Promise<void>;
    fetchPerformanceBreakdown: (range?: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    data: null,
    loading: false,
    error: null,
    fetchDashboard: async (range = '7d', page = 1, limit = 6) => {
        set({ loading: true, error: null });
        try {
            const data = await apiClient.dashboard.getDashboard(range, page, limit) as DashboardData; 
            set({ data, loading: false });
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            set({ error: err.message, loading: false });
        }
    },
    fetchPerformanceTrend: async (range = '7d') => {
        try {
            // @ts-ignore
            const trendData = await apiClient.dashboard.getTrend(range) as { 
                performanceTrend: any;
                deltaPct?: number | null;
                healthStatus?: 'green' | 'yellow' | 'red'; 
            };
            set((state) => ({
                data: state.data ? {
                    ...state.data,
                    performanceTrend: trendData.performanceTrend,
                    deltaPct: trendData.deltaPct,
                    healthStatus: trendData.healthStatus
                } : null
            }));
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("Failed to fetch performance trend:", err);
        }
    },
    fetchPerformanceBreakdownMetadata: async () => {
        try {
            // @ts-ignore
            const metadata = await apiClient.dashboard.getPerformanceBreakdownMetadata() as DashboardData['drilldownMetadata'];
            set((state) => ({
                data: state.data ? {
                    ...state.data,
                    drilldownMetadata: metadata
                } : null
            }));
        } catch (err: any) {
            console.error("Failed to fetch drilldown metadata:", err);
        }
    },
    fetchPerformanceBreakdown: async (range = '28d') => {
        try {
            // @ts-ignore
            const breakdownData = await apiClient.dashboard.getPerformanceBreakdown(range) as { breakdown: DashboardData['drilldownBreakdown'] };
            set((state) => ({
                data: state.data ? {
                    ...state.data,
                    drilldownBreakdown: breakdownData.breakdown
                } : null
            }));
        } catch (err: any) {
            console.error("Failed to fetch drilldown analytics:", err);
        }
    }
}));
