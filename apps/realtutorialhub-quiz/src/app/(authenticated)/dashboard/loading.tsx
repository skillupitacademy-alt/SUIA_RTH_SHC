import { ZSkeleton, ZLoader } from "@quiz/ui";

export default function DashboardLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <ZSkeleton className="h-9 w-56" />
                <ZSkeleton className="h-10 w-36" />
            </div>
            <div className="relative min-h-[400px]">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <ZLoader size="lg" text="Loading dashboard" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-30">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <ZSkeleton className="h-6 w-3/4 mb-4" />
                            <ZSkeleton className="h-4 w-full mb-2" variant="line" />
                            <ZSkeleton className="h-4 w-5/6 mb-6" variant="line" />
                            <ZSkeleton className="h-8 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
