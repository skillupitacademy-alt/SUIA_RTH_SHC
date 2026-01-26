import { LiveSessionsList } from "@/components/dashboard/LiveSessionsList";
import { SecurityHealthPanel } from "@/components/dashboard/SecurityHealthPanel";
import { ContentReadinessBoard } from "@/components/dashboard/ContentReadinessBoard";
import { UserAnalyticsPanel } from "@/components/dashboard/UserAnalyticsPanel";
import { PerformanceAnalyticsBoard } from "@/components/dashboard/PerformanceAnalyticsBoard";
import { RBACGovernancePanel } from "@/components/dashboard/RBACGovernancePanel";
import { BlueprintAuditBoard } from "@/components/dashboard/BlueprintAuditBoard";
import { SystemAuditTerminal } from "@/components/dashboard/SystemAuditTerminal";
import { ExamActivityBoard } from "@/components/dashboard/ExamActivityBoard";
import { Activity } from "lucide-react";

export default function AdminDashboard() {
    return (
        <div className="space-y-16 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b-2 border-primary/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity size={20} className="text-[#FF4B91]" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Control Deck_</span>
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter italic uppercase text-[#1A1A1A]">Enterprise Dashboard</h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Platform Health • Security • Quality Management</p>
                </div>
                <div className="flex flex-col items-end gap-3 text-right">
                    <span className="px-5 py-2.5 rounded-full bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-widest">Alpha Terminal v1.1.2</span>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Authoritative_Spec_Parity: 100%</p>
                </div>
            </div>

            {/* Account & Performance Tier */}
            <div className="flex flex-col gap-12">
                <UserAnalyticsPanel />
                <ExamActivityBoard />
                <RBACGovernancePanel />
            </div>

            {/* Security & Audit Tier */}
            <div className="flex flex-col gap-12">
                <SecurityHealthPanel />
                <SystemAuditTerminal />
            </div>

            {/* Content & Blueprint Tier */}
            <div className="flex flex-col gap-12">
                <div className="w-full">
                    <ContentReadinessBoard />
                </div>
                <BlueprintAuditBoard />
            </div>

            {/* Performance & Analytics Section */}
            <PerformanceAnalyticsBoard />

            {/* Live Operations Section */}
            <LiveSessionsList />
        </div>
    );
}
