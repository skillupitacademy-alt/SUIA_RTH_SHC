'use client';

import Link from 'next/link';

export default function UsersError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">User management error</h2>
            <p className="text-slate-500 mb-8 max-w-md">
                Unable to load user data. Please try again.
            </p>
            <div className="flex gap-4">
                <button onClick={() => reset()} className="px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors">Retry</button>
                <Link href="/dashboard" className="px-6 py-3 bg-white text-slate-600 border border-slate-300 font-medium rounded-lg hover:bg-slate-50 transition-colors">Back to Dashboard</Link>
            </div>
            {process.env.NODE_ENV === 'development' && <pre className="mt-8 p-4 bg-slate-50 rounded-xl text-xs text-red-600 max-w-2xl w-full overflow-auto text-left">{error.message}</pre>}
        </div>
    );
}
