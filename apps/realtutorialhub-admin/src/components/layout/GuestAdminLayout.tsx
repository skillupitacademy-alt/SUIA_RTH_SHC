'use client';

export function GuestAdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background font-sans">
            {/* Visual Side */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-50 border-r border-slate-200 text-[#1A1A1A] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070')] bg-cover opacity-5 grayscale" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-[#FF4B91] flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-[#FF4B91]/20">Q</div>
                        <span className="text-2xl font-bold tracking-tighter text-[#1A1A1A]">QUIZADMIN</span>
                    </div>
                </div>
                <div className="relative z-10 space-y-6">
                    <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-[#1A1A1A] font-outfit">
                        Secure <br />
                        <span className="text-[#FF4B91]">Governance</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-md leading-relaxed">
                        Authorized personnel only. Secure access to the governance terminal is strictly audited.
                    </p>
                </div>
                <div className="relative z-10 alpha-terminal text-slate-400">
                    System ID: RH-9011-GC // Secure Layer V1
                </div>
            </div>

            {/* Form Side */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </div>
        </div>
    );
}
