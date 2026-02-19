'use client';
/* eslint-disable simple-import-sort/imports */

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Brain, Mail, PieChart as PieChartIcon, TrendingDown, MessagesSquare } from "lucide-react";

import BaseChart from "@/components/charts/BaseChart";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { HelpRequestManager } from "@/components/tutor/HelpRequestManager";

type TutorMetrics = {
    notesDemand: { name: string; count: number }[];
    emailHealth: { status: string; count: number }[];
    weakTopics: { name: string; student_count: number }[];
    helpRequests: { status: string; count: number }[];
};

export default function TutorAnalyticsPage() {
    const [data, setData] = useState<TutorMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTutorMetrics = async () => {
            try {
                const res = await fetch('/api/admin/metrics/tutor');
                if (res.ok) {
                    const json: TutorMetrics = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error('Failed to fetch tutor analytics', err);
            } finally {
                setLoading(false);
            }
        };
        void fetchTutorMetrics();
    }, []);

    if (loading) return (
        <div className="p-8 animate-pulse space-y-8 max-w-[1600px] mx-auto">
            <div className="h-16 w-1/4 bg-slate-100 rounded-2xl mb-12" />
            <div className="grid grid-cols-4 gap-8">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-50 rounded-[2rem]" />)}
            </div>
            <div className="grid grid-cols-2 gap-8">
                <div className="h-80 bg-slate-50 rounded-[2rem]" />
                <div className="h-80 bg-slate-50 rounded-[2rem]" />
            </div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center p-12 bg-white rounded-[2rem] border border-slate-200">
                <AlertTriangle className="text-rose-500 mx-auto mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-900 uppercase">Analysis Offline</h2>
                <p className="text-slate-500 mt-2">Could not retrieve Smart Tutor telemetry data.</p>
            </div>
        </div>
    );

    const helpRequestsOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [{
            name: 'Status',
            type: 'pie',
            radius: ['45%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            color: ['#f97316', '#3b82f6', '#10b981'],
            data: data.helpRequests.map((d) => ({
                value: d.count,
                name: d.status.toUpperCase()
            }))
        }]
    };

    const notesDemandOption = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: data.notesDemand.map((d) => d.name),
            axisLabel: { rotate: 30, fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
        },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
        series: [{
            data: data.notesDemand.map((d) => d.count),
            type: 'bar',
            barWidth: '40%',
            itemStyle: {
                color: '#f97316',
                borderRadius: [4, 4, 0, 0],
                shadowColor: 'rgba(249, 115, 22, 0.3)',
                shadowBlur: 10
            }
        }]
    };

    const emailHealthOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [{
            name: 'Status',
            type: 'pie',
            radius: ['45%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            color: ['#10b981', '#f59e0b', '#ef4444', '#64748b'],
            data: data.emailHealth.map((d) => ({
                value: d.count,
                name: d.status.toUpperCase()
            }))
        }]
    };

    const weakTopicsOption = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        yAxis: {
            type: 'category',
            data: data.weakTopics.map((d) => d.name),
            axisLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
        },
        series: [{
            data: data.weakTopics.map((d) => d.student_count),
            type: 'bar',
            itemStyle: {
                color: '#ef4444',
                borderRadius: [0, 4, 4, 0],
                shadowColor: 'rgba(239, 68, 68, 0.3)',
                shadowBlur: 10
            }
        }]
    };

    const totalEmails = data.emailHealth.reduce((a, b) => a + b.count, 0);
    const successEmails = data.emailHealth.find((s) => s.status === 'completed')?.count ?? 0;
    const healthRate = totalEmails > 0 ? Math.round((successEmails / totalEmails) * 100) : 100;
    const pendingHelp = data.helpRequests.find(h => h.status === 'pending')?.count ?? 0;

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <DashboardPageHeader
                title="Smart Tutor Analytics"
                description="Real-time telemetry for automated learning material delivery and live help requests."
                icon={<Brain className="text-orange-500" size={20} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Mail size={64} /></div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Resource Demand</h4>
                    <p className="text-4xl font-black text-slate-900">{data.notesDemand.reduce((acc, item) => acc + item.count, 0)}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1"><Activity size={10} /> Total Downloads/Emails</p>
                </div>

                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group border-b-blue-500 border-b-4">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-blue-500"><Activity size={64} /></div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Delivery Health</h4>
                    <p className="text-4xl font-black text-slate-900">{healthRate}%</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">Email Success Rate</p>
                </div>

                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group border-b-orange-500 border-b-4">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-orange-500"><MessagesSquare size={64} /></div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Live Help Requests</h4>
                    <p className="text-4xl font-black text-slate-900">{pendingHelp}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">Pending Tutor Interventions</p>
                </div>

                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group border-b-rose-500 border-b-4">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-rose-500"><AlertTriangle size={64} /></div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Critical Gaps</h4>
                    <p className="text-4xl font-black text-slate-900">{data.weakTopics.length}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">Topics with low accuracy</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500"><BarChart3 size={20} /></div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Material Demand Surge</h3>
                    </div>
                    <BaseChart option={notesDemandOption} height={350} />
                </div>

                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500"><MessagesSquare size={20} /></div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Help Request Status</h3>
                    </div>
                    <BaseChart option={helpRequestsOption} height={350} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><PieChartIcon size={20} /></div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Email System Health</h3>
                    </div>
                    <BaseChart option={emailHealthOption} height={350} />
                </div>

                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500"><TrendingDown size={20} /></div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Student Mastery Gaps</h3>
                    </div>
                    <BaseChart option={weakTopicsOption} height={350} />
                </div>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><MessagesSquare size={20} /></div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Interventions</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Manage live help requests and student support</p>
                        </div>
                    </div>
                </div>
                <HelpRequestManager />
            </div>
        </div>
    );
}
