import { ZSkeleton, ZLoader } from "@quiz/ui";

export default function ExamLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="relative min-h-[500px]">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <ZLoader size="xl" text="Preparing exam" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 opacity-30">
                    {/* Question Block */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                        <ZSkeleton className="h-6 w-48 mb-6" />
                        <ZSkeleton className="h-5 w-full mb-3" variant="line" />
                        <ZSkeleton className="h-5 w-4/5 mb-8" variant="line" />
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <ZSkeleton key={i} className="h-14 w-full" />
                            ))}
                        </div>
                    </div>
                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <ZSkeleton className="h-5 w-32 mb-4" />
                            <ZSkeleton className="h-10 w-full mb-4" />
                            <div className="grid grid-cols-5 gap-2">
                                {[...Array(10)].map((_, i) => (
                                    <ZSkeleton key={i} className="h-8 w-8" variant="circle" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
