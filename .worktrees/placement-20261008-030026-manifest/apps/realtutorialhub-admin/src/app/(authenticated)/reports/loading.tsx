import { ZLoader,ZSkeleton } from "@quiz/ui";

export default function AdminReportsLoading() {
    return (
        <div className="container mx-auto px-6 py-8">
            <ZSkeleton className="h-9 w-48 mb-8" />
            <div className="relative min-h-[400px]">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <ZLoader size="lg" text="Loading reports" />
                </div>
                <div className="opacity-30 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <ZSkeleton className="h-6 w-64 mb-4" />
                        <ZSkeleton className="h-4 w-full mb-2" variant="line" />
                        <ZSkeleton className="h-4 w-3/4" variant="line" />
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-48">
                        <ZSkeleton className="h-full w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
