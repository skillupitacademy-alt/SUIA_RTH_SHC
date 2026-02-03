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
    performanceTrend: Array<{ score: number; date: string }>;
}

interface DashboardState {
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
    fetchDashboard: (range?: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    data: null,
    loading: false,
    error: null,
    fetchDashboard: async (range = '7d') => {
        set({ loading: true, error: null });
        try {
            const data = await apiClient.dashboard.getDashboard(range); 
            set({ data, loading: false });
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            set({ error: err.message, loading: false });
        }
    },
}));
