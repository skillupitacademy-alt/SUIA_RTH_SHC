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
}

interface DashboardState {
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
    fetchDashboard: (range?: string, page?: number, limit?: number) => Promise<void>;
    fetchPerformanceTrend: (range?: string) => Promise<void>;
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
        // Targeted fetch that ONLY updates graph data (decoupling)
        try {
            // @ts-ignore - getTrend might be missing from type def if not built yet
            const trendData = await apiClient.dashboard.getTrend(range) as { performanceTrend: any };
            set((state) => ({
                data: state.data ? {
                    ...state.data,
                    performanceTrend: trendData.performanceTrend
                } : null
            }));
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("Failed to fetch performance trend:", err);
        }
    }
}));
