'use client';

import Link from 'next/link';

export default function Error({
    error: _error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-center">
            <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Auth Error</h2>
                <p className="text-slate-500 mb-8">
                    Unable to access the administrator login. Please verify your credentials or network status.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => reset()}
                        className="w-full px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/login"
                        className="block w-full px-6 py-3 bg-white text-slate-600 border border-slate-300 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Back to Admin Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
