'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 text-center font-sans">
                <div className="max-w-md p-8 bg-white shadow-xl rounded-2xl border border-slate-200">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Critical Admin Error</h1>
                    <p className="text-slate-500 mb-8">
                        A critical error occurred in the administrative interface.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="w-full px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors mb-4"
                    >
                        Attempt Recovery
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 text-left p-4 bg-slate-100 rounded text-xs overflow-auto max-h-40">
                            <p className="font-mono text-red-600">{error.message}</p>
                            {error.stack != null ? <pre className="mt-2 text-slate-600">{error.stack}</pre> : null}
                        </div>
                    )}
                </div>
            </body>
        </html>
    );
}
