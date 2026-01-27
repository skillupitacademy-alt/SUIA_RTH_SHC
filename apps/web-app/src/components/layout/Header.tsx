'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LayoutDashboard, LogIn, UserPlus, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

export function Header() {
    const { isAuthenticated, user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between px-6 mx-auto">
                <div className="flex items-center gap-6 md:gap-8">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="inline-block font-bold text-xl text-primary">QuizPlatform</span>
                    </Link>
                    <nav className="flex gap-6">
                        {isAuthenticated && (
                            <Link
                                href="/dashboard"
                                className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                <LayoutDashboard size={18} className="mr-2" />
                                Dashboard
                            </Link>
                        )}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <nav className="flex items-center gap-2">
                        {!isAuthenticated ? (
                            <>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                >
                                    <LogIn size={18} className="mr-2" />
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                                >
                                    <UserPlus size={18} className="mr-2" />
                                    Sign Up
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                    <User size={16} />
                                    {user?.name}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-red-500"
                                >
                                    <LogOut size={18} className="mr-2" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
