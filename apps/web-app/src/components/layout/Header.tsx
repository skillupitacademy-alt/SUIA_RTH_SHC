'use client';

import Link from 'next/link';
import { LayoutDashboard, LogIn, UserPlus, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';

export function Header() {
    const auth = useAuth();
    const isAuthenticated = auth?.isAuthenticated ?? false;
    const user = auth?.user;
    const logout = auth?.logout ?? (() => {});
    const loading = auth?.loading ?? false;
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between px-6 mx-auto">
                <div className="flex items-center gap-6 md:gap-8">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="inline-block font-bold text-xl text-primary font-mono tracking-tighter">
                            QUIZ<span className="text-foreground">PLATFORM</span>
                        </span>
                    </Link>
                    <nav className="flex gap-6">
                        {isAuthenticated && !loading && !isAuthPage && (
                            <Link
                                href="/dashboard"
                                className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                                aria-label="Go to dashboard"
                                aria-current={pathname === '/dashboard' ? "page" : undefined}
                            >
                                <LayoutDashboard size={18} className="mr-2" />
                                Dashboard
                            </Link>
                        )}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <nav className="flex items-center gap-2">
                        {loading ? (
                            <div className="flex items-center gap-4">
                                <div className="h-4 w-20 animate-pulse bg-muted rounded" />
                                <div className="h-9 w-20 animate-pulse bg-muted rounded-md" />
                            </div>
                        ) : !isAuthenticated || isAuthPage ? (
                            <>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                    aria-label="Log in"
                                >
                                    <LogIn size={18} className="mr-2" />
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                                    aria-label="Create an account"
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
                                    aria-label="Log out"
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
