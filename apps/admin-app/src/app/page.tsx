import { LiveSessionsList } from "@/components/dashboard/LiveSessionsList";
import { SecurityHealthPanel } from "@/components/dashboard/SecurityHealthPanel";
import { ServiceHealth } from "@/components/dashboard/ServiceHealth";
import { ContentReadinessBoard } from "@/components/dashboard/ContentReadinessBoard";
import { UserAnalyticsPanel } from "@/components/dashboard/UserAnalyticsPanel";
import { PerformanceAnalyticsBoard } from "@/components/dashboard/PerformanceAnalyticsBoard";
import { RBACGovernancePanel } from "@/components/dashboard/RBACGovernancePanel";
import { BlueprintAuditBoard } from "@/components/dashboard/BlueprintAuditBoard";
import { SystemAuditTerminal } from "@/components/dashboard/SystemAuditTerminal";
import { ExamActivityBoard } from "@/components/dashboard/ExamActivityBoard";
import { QuestionFactoryAIPanel } from "@/components/dashboard/QuestionFactoryAIPanel";
import { ControlCenterDeck } from "@/components/dashboard/ControlCenterDeck";
import { Activity } from "lucide-react";

export default function AdminDashboard() {
    return (
        <div className="space-y-10 pb-16">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b-2 border-primary/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity size={20} className="text-[#FF4B91]" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Control Deck_</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter italic uppercase text-[#1A1A1A]">Enterprise Dashboard</h1>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Platform Health • Security • Quality Management</p>
                </div>
                <div className="flex flex-col items-end gap-3 text-right">
                    <span className="px-5 py-2.5 rounded-full bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-widest">Alpha Terminal v1.1.2</span>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Authoritative_Spec_Parity: 100%</p>
                </div>
            </div>

            {/* 1. Control Center (Top Cards) */}
            <ControlCenterDeck />

            {/* 2. Performance & Efficiency Tier */}
            <PerformanceAnalyticsBoard />

            {/* 3. System Health Section */}
            <ServiceHealth />

            {/* 4. Security & User Activity Tier */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <SecurityHealthPanel />
                    <UserAnalyticsPanel />
                    <SystemAuditTerminal />
                </div>
                <div className="space-y-8">
                    <ExamActivityBoard />
                    <RBACGovernancePanel />
                    <LiveSessionsList />
                </div>
            </div>

            {/* 5. Content & Blueprint Tier */}
            <div className="flex flex-col gap-8 pt-8 border-t border-muted/20">
                <QuestionFactoryAIPanel />
                <div className="w-full">
                    <ContentReadinessBoard />
                </div>
                <BlueprintAuditBoard />
            </div>
        </div>
    );
}
