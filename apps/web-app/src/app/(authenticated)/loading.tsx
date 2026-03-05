import { ZSkeleton, ZLoader } from "@quiz/ui";

export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-12">
                <ZSkeleton className="h-10 w-48" />
                <ZSkeleton className="h-10 w-32" />
            </div>

            <div className="relative min-h-[400px]">
                {/* Brand Loader Centered in Content Area */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <ZLoader size="xl" text="Preparing your dashboard" />
                </div>

                {/* Layout Skeleton Background */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-40">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <ZSkeleton className="h-6 w-3/4 mb-4" />
                            <ZSkeleton className="h-4 w-full mb-2" />
                            <ZSkeleton className="h-4 w-5/6 mb-8" />
                            <div className="flex justify-between items-center">
                                <ZSkeleton className="h-8 w-24" />
                                <ZSkeleton className="h-6 w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
