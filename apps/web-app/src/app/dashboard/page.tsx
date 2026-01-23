'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) return <p className="text-center mt-10">Loading...</p>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Welcome, {user.email}!</h1>
            <p className="mt-4 text-gray-600">This is your protected dashboard.</p>
            <button
                onClick={() => {
                    logout();
                    router.push('/login');
                }}
                className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
                Logout
            </button>
        </div>
    );
}
