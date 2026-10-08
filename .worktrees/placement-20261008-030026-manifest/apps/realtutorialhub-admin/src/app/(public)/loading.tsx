import { ZLoader,ZSkeleton } from "@quiz/ui";

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden">
                {/* Subtle Brand Highlight for Admin */}
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: '#FF2D55' }} />

                <div className="text-center mb-8">
                    <ZLoader size="lg" text="Admin Portal" />
                </div>

                <div className="space-y-6 opacity-30">
                    <div className="space-y-2">
                        <ZSkeleton className="h-4 w-20" variant="line" />
                        <ZSkeleton className="h-12 w-full" />
                    </div>
                    <div className="space-y-2">
                        <ZSkeleton className="h-4 w-24" variant="line" />
                        <ZSkeleton className="h-12 w-full" />
                    </div>
                    <ZSkeleton className="h-12 w-full mt-8" />
                </div>
            </div>
        </div>
    );
}
