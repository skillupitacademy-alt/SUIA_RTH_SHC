/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { create } from 'zustand';
import { apiClient } from '@quiz/api-client';
import { persist } from 'zustand/middleware';

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
    currentAvg?: number;
    previousAvg?: number;
    healthStatus?: 'green' | 'yellow' | 'red';
    drilldownBreakdown?: Array<{ name: string; count: number; avgScore: number }>;
}

interface DrilldownMetadata {
    domains: Array<{ dimensionId: string; name: string }>;
    subjects: Array<{ dimensionId: string; name: string }>;
    topics: Array<{ dimensionId: string; name: string }>;
}

interface DashboardState {
    data: DashboardData | null;
    drilldownMetadata: DrilldownMetadata | null;
    filters: {
        domain: string;
        subject: string;
        topic: string;
    };
    loading: boolean;
    metadataLoading: boolean;
    error: string | null;
    fetchDashboard: (range?: string, page?: number, limit?: number) => Promise<void>;
    fetchPerformanceTrend: (range?: string) => Promise<void>;
    fetchPerformanceBreakdownMetadata: () => Promise<void>;
    fetchPerformanceBreakdown: (range?: string) => Promise<void>;
    setFilter: (key: keyof DashboardState['filters'], value: string) => void;
    clearFilters: () => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set, get) => ({
            data: null,
            drilldownMetadata: null,
            filters: {
                domain: 'all',
                subject: 'all',
                topic: 'all'
            },
            loading: false,
            metadataLoading: false,
            error: null,
            
            setFilter: (key, value) => set((state) => ({
                filters: { ...state.filters, [key]: value }
            })),

            clearFilters: () => set({
                filters: { domain: 'all', subject: 'all', topic: 'all' }
            }),

            fetchDashboard: async (range = '7d', page = 1, limit = 6) => {
                set({ loading: true, error: null });
                try {
                    const data = await apiClient.dashboard.getDashboard(range, page, limit) as DashboardData; 
                    set({ data, loading: false });
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Failed to load dashboard';
                    set({ error: message, loading: false });
                }
            },

            fetchPerformanceTrend: async (range = '7d') => {
                try {
                    const trendData = await apiClient.dashboard.getTrend(range) as { 
                        performanceTrend: Array<{ score: number; date: string }>;
                        deltaPct?: number | null;
                        currentAvg?: number;
                        previousAvg?: number;
                        healthStatus?: 'green' | 'yellow' | 'red'; 
                    };
                    set((state) => ({
                        data: state.data ? {
                            ...state.data,
                            performanceTrend: trendData.performanceTrend,
                            deltaPct: trendData.deltaPct,
                            currentAvg: trendData.currentAvg,
                            previousAvg: trendData.previousAvg,
                            healthStatus: trendData.healthStatus
                        } : null
                    }));
                } catch (err: unknown) {
                    console.error("Failed to fetch performance trend:", err);
                }
            },

            fetchPerformanceBreakdownMetadata: async () => {
                // Prevent over-fetching if already loaded
                if (get().drilldownMetadata) return;

                set({ metadataLoading: true });
                try {
                    const metadata = await apiClient.dashboard.getPerformanceBreakdownMetadata() as DrilldownMetadata;
                    set({ 
                        drilldownMetadata: metadata,
                        metadataLoading: false 
                    });
                } catch (err: unknown) {
                    console.error("Failed to fetch drilldown metadata:", err);
                    set({ metadataLoading: false });
                }
            },

            fetchPerformanceBreakdown: async (range = '28d') => {
                try {
                    const breakdownData = await apiClient.dashboard.getPerformanceBreakdown(range) as { breakdown: DashboardData['drilldownBreakdown'] };
                    set((state) => ({
                        data: state.data ? {
                            ...state.data,
                            drilldownBreakdown: breakdownData.breakdown
                        } : null
                    }));
                } catch (err: unknown) {
                    console.error("Failed to fetch drilldown analytics:", err);
                }
            }
        }),
        {
            name: 'quiz-dashboard-storage',
            partialize: (state) => ({ filters: state.filters }), // Only persist filters
        }
    )
);
