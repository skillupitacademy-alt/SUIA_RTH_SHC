import { ZLoader,ZSkeleton } from "@quiz/ui";

export default function Loading() {
    return (
        <div className="container mx-auto px-6 py-8">
            {/* Admin Toolbar Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <ZSkeleton className="h-9 w-64" />
                <ZSkeleton className="h-10 w-40" />
            </div>

            <div className="relative min-h-[500px]">
                {/* Brand Loader for Admin Experience */}
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-50/50 backdrop-blur-[1px]">
                    <ZLoader size="xl" text="Loading admin modules" />
                </div>

                {/* Admin Stats Blocks Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 opacity-40">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <ZSkeleton className="h-4 w-24 mb-4" variant="line" />
                            <ZSkeleton className="h-8 w-16" />
                        </div>
                    ))}
                </div>

                {/* Main Content Table Skeleton */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden opacity-40">
                    <div className="h-12 bg-slate-50 border-b border-slate-200 px-6 flex items-center">
                        <ZSkeleton className="h-4 w-32" variant="line" />
                    </div>
                    <div className="p-6 space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <ZSkeleton className="h-10 w-10 shrink-0" variant="circle" />
                                <div className="flex-1 space-y-2">
                                    <ZSkeleton className="h-4 w-1/4" variant="line" />
                                    <ZSkeleton className="h-3 w-3/4" variant="line" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
