'use client';

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-slate-700 mb-6">Admin Page Not Found</h2>
            <p className="text-slate-500 mb-8 max-w-md">
                The administrative resource you&apos;re looking for was not found. Please check the URL or return to the dashboard.
            </p>
            <Link
                href="/dashboard"
                className="px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
                Go to Admin Dashboard
            </Link>
        </div>
    );
}
