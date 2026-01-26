import { AdminShell } from "@/components/layout/AdminShell";
import { LiveSessionsList } from "@/components/dashboard/LiveSessionsList";

export default function AdminDashboard() {
    return (
        <AdminShell>
            <div className="space-y-12 pb-24">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-2 border-primary/5">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Governance Terminal</h1>
                        <p className="text-muted-foreground font-bold tracking-tight mt-2">Real-time observer and active session management.</p>
                    </div>
                </div>

                <div className="max-w-4xl">
                    <LiveSessionsList />
                </div>
            </div>
        </AdminShell>
    );
}
