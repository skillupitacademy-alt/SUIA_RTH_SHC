import { create } from 'zustand';
import { apiClient } from '@quiz/api-client';

interface DashboardData {
    overview: {
        avgScore: number;
        totalExams: number;
        masteryPoints: number;
    };
    recentActivity: Array<{
        id: string;
        title: string;
        score: number | null;
        relativeTime: string;
        status: string;
    }>;
    performanceTrend: number[];
}

interface DashboardState {
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
    fetchDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    data: null,
    loading: false,
    error: null,
    fetchDashboard: async () => {
        set({ loading: true, error: null });
        try {
            const data = await apiClient.dashboard.getDashboard(); 
            set({ data, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },
}));
