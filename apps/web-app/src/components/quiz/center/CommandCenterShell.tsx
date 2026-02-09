'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { GlobalSearchDialog } from '@/components/common/GlobalSearchDialog'; // Removed as per instruction

interface CommandCenterShellProps {
    leftPane: React.ReactNode;
    rightPane: React.ReactNode;
    footer: React.ReactNode;
    onExit?: () => void;
}

export function CommandCenterShell({ leftPane, rightPane, footer, onExit }: CommandCenterShellProps) {
    const router = useRouter();

    const handleExit = () => {
        if (onExit) {
            onExit();
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="h-[100dvh] w-screen bg-[#F9FAFB] flex flex-col overflow-hidden relative selection:bg-[#FF2D55]/20">
            {/* Embedded Global Search for power users */}
            {/* <GlobalSearchDialog /> */}

            {/* HEADER: Anchored Top (Minimal) */}
            <header className="h-16 px-6 flex items-center justify-between border-b border-white/50 bg-white/50 backdrop-blur-md z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                        <span className="text-white font-black font-outfit text-lg">Q</span>
                    </div>
                    <span className="font-bold font-outfit text-xl tracking-tight text-zinc-900">Command Center</span>
                </div>
                <button
                    onClick={handleExit}
                    className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    title="Exit to Dashboard"
                >
                    <X size={20} />
                </button>
            </header>

            {/* MAIN GRID */}
            <main className="flex-1 min-h-0 w-full max-w-[1920px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_400px] 2xl:grid-cols-[1fr_480px]">
                {/* LEFT PANE: Configuration Area */}
                <div className="relative h-full overflow-y-auto overflow-x-hidden p-6 md:p-8 xl:p-12 scrollbar-thin">
                    <div className="max-w-5xl mx-auto w-full">
                        {leftPane}
                    </div>
                </div>

                {/* RIGHT PANE: Summary Rail (Hidden on mobile/tablet until triggered, or stacked) */}
                <div className="hidden xl:flex flex-col border-l border-border/50 bg-white/50 backdrop-blur-xl relative z-10">
                    <div className="flex-1 w-full h-full overflow-hidden relative">
                        {rightPane}
                    </div>
                </div>
            </main>

            {/* FOOTER: Fixed Action Bar */}
            <footer className="flex-none h-[88px] md:h-[100px] bg-white border-t border-border/50 px-6 md:px-12 flex items-center justify-between z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                {footer}
            </footer>
        </div>
    );
}
