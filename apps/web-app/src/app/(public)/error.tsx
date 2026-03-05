'use client';

import Link from 'next/link';

export default function Error({
    reset,
}: {
    error?: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-center">
            <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
                <p className="text-gray-500 mb-8">
                    We couldn&apos;t connect to the authentication service. Please check your internet connection and try again.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => reset()}
                        className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/login"
                        className="block w-full px-6 py-3 bg-white text-gray-600 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
