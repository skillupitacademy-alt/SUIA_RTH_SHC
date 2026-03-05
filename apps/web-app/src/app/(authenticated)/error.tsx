'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service if needed
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">An error occurred</h2>
            <p className="text-gray-500 mb-8 max-w-md">
                We encountered an error while loading this page. This might be a temporary issue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Try Again
                </button>
                <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-white text-gray-600 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Back to Dashboard
                </Link>
            </div>
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-12 text-left p-6 bg-gray-50 rounded-xl border border-gray-200 max-w-2xl w-full">
                    <p className="text-sm font-semibold text-red-600 mb-2 font-mono">DEBUG INFO:</p>
                    <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap">
                        {error.message}
                        {"\n\n"}
                        {error.stack}
                    </pre>
                </div>
            )}
        </div>
    );
}
