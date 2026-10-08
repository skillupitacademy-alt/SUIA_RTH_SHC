import { ZLoader,ZSkeleton } from "@quiz/ui";

export default function UsersLoading() {
    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <ZSkeleton className="h-9 w-40" />
                <ZSkeleton className="h-10 w-32" />
            </div>
            <div className="relative min-h-[400px]">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <ZLoader size="lg" text="Loading users" />
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden opacity-30">
                    <div className="p-4 space-y-3">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 border-b border-slate-100">
                                <ZSkeleton className="h-10 w-10 shrink-0" variant="circle" />
                                <div className="flex-1 space-y-2">
                                    <ZSkeleton className="h-4 w-1/4" variant="line" />
                                    <ZSkeleton className="h-3 w-1/2" variant="line" />
                                </div>
                                <ZSkeleton className="h-6 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
