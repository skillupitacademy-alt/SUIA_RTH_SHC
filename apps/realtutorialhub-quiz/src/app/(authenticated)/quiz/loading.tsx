import { ZSkeleton, ZLoader } from "@quiz/ui";

export default function QuizLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <ZSkeleton className="h-9 w-56 mb-8" />
            <div className="relative min-h-[400px]">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <ZLoader size="lg" text="Loading quiz setup" />
                </div>
                <div className="opacity-30 space-y-6">
                    {/* Multi-step form skeleton */}
                    <div className="flex gap-2 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <ZSkeleton key={i} className="h-2 flex-1" />
                        ))}
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
                        <ZSkeleton className="h-6 w-48 mb-2" />
                        <ZSkeleton className="h-4 w-full" variant="line" />
                        <div className="grid grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <ZSkeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                        <ZSkeleton className="h-12 w-full mt-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
