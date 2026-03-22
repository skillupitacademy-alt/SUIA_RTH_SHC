import { ZSkeleton, ZLoader } from "@quiz/ui";

export default function ReportsLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <ZSkeleton className="h-9 w-48 mb-8" />
            <div className="relative min-h-[400px]">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <ZLoader size="lg" text="Loading report" />
                </div>
                <div className="opacity-30 space-y-6">
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <ZSkeleton className="h-6 w-64 mb-4" />
                        <ZSkeleton className="h-4 w-full mb-2" variant="line" />
                        <ZSkeleton className="h-4 w-3/4" variant="line" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-64">
                        <ZSkeleton className="h-5 w-40 mb-4" />
                        <ZSkeleton className="h-full w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
