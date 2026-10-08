
import { ZLoader } from '@quiz/ui';

export default function DashboardLoading() {
    return (
        <div className="w-full h-[60vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <ZLoader size="lg" center={false} />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">
                    Loading Dashboard...
                </p>
            </div>
        </div>
    );
}
