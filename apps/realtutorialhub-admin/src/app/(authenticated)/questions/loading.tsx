import { ZLoader,ZSkeleton } from "@quiz/ui";

export default function QuestionsLoading() {
    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <ZSkeleton className="h-9 w-48" />
                <ZSkeleton className="h-10 w-36" />
            </div>
            <div className="relative min-h-[400px]">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <ZLoader size="lg" text="Loading questions" />
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden opacity-30">
                    <div className="h-12 bg-slate-50 border-b border-slate-200 px-6 flex items-center gap-4">
                        <ZSkeleton className="h-4 w-20" variant="line" />
                        <ZSkeleton className="h-4 w-32" variant="line" />
                        <ZSkeleton className="h-4 w-24" variant="line" />
                    </div>
                    <div className="p-4 space-y-3">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 border-b border-slate-100">
                                <ZSkeleton className="h-5 w-5 shrink-0" />
                                <ZSkeleton className="h-4 flex-1" variant="line" />
                                <ZSkeleton className="h-6 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
