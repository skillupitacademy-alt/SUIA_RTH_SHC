'use client';

import Link from 'next/link';

export default function ReportsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to load your report</h2>
            <p className="text-gray-500 mb-8 max-w-md">
                We had trouble fetching your report data. Please try again in a moment.
            </p>
            <div className="flex gap-4">
                <button onClick={() => reset()} className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">Try Again</button>
                <Link href="/dashboard" className="px-6 py-3 bg-white text-gray-600 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors">Return to Dashboard</Link>
            </div>
            {process.env.NODE_ENV === 'development' && <pre className="mt-8 p-4 bg-gray-50 rounded-xl text-xs text-red-600 max-w-2xl w-full overflow-auto text-left">{error.message}</pre>}
        </div>
    );
}
