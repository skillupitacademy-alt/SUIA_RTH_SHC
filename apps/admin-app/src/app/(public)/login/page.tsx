'use client';

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';

export default function AdminLoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const toErrorMessage = (err: unknown): string => {
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
            return 'Network/CORS block: unable to reach the API. Check allowed origins and portal headers.';
        }

        if (err !== null && typeof err === 'object') {
            const maybeError = err as { _error?: unknown; message?: unknown };
            const portalMsg = typeof maybeError._error === 'string' ? maybeError._error.trim() : '';
            if (portalMsg !== '') return portalMsg;

            const genericMsg = typeof maybeError.message === 'string' ? maybeError.message.trim() : '';
            if (genericMsg !== '') return genericMsg;
        }

        return 'Authentication failed';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // STRICT BOUNDARY: Use Admin Client (hits /api/admin/auth/login)
            apiClient.client.setPortalIdentity('admin');
            const { user } = await apiClient.admin.login(formData.email, formData.password);

            // Redundant check (API should handle this), but safe for UI
            if (user.isAdmin !== true) {
                throw new Error("Access Denied: Governance Privileges Required.");
            }

            login(user);
            router.push('/');
        } catch (err: unknown) {
            clientLogger.error('Admin login failed', { error: err instanceof Error ? err.message : 'unknown' });
            setError(toErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2 text-[#1A1A1A]">Welcome Back</h2>
                <p className="text-sm text-muted-foreground">Authenticate to access the governance terminal.</p>
            </div>

            {error ? <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold flex items-center gap-2">
                <ShieldCheck size={16} />
                {error}
            </div> : null}

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6" autoComplete="off">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-500" htmlFor="admin-login-email">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-4 text-slate-400 h-5 w-5" />
                        <input
                            type="email"
                            required
                            id="admin-login-email"
                            name="username"
                            autoComplete="username"
                            className="w-full pl-12 pr-4 py-4 rounded-xl border bg-slate-50 text-[#1A1A1A] text-[15px] focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-semibold"
                            placeholder="admin@quizplatform.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium leading-none text-slate-500" htmlFor="admin-login-password">Password</label>
                        <Link
                            href="/forgot-password"
                            className="text-sm font-medium text-[#FF4B91] hover:underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-4 text-slate-400 h-5 w-5" />
                        <input
                            type="password"
                            required
                            minLength={1}
                            id="admin-login-password"
                            name="password"
                            autoComplete="new-password"
                            className="w-full pl-12 pr-4 py-4 rounded-xl border bg-slate-50 text-[#1A1A1A] text-[15px] focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-semibold"
                            placeholder="••••••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-5 rounded-xl bg-[#FF4B91] text-white font-bold tracking-normal text-sm shadow-lg shadow-[#FF4B91]/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                >
                    {isLoading ? (
                        <>
                            <ZLoader size="xs" className="text-white" center={false} />
                            AUTHENTICATING...
                        </>
                    ) : (
                        "AUTHENTICATE"
                    )}
                </button>
            </form>

            <div className="mt-8 pt-8 border-t text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Restricted Access System v1.0.4</p>
                <p className="mt-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Unauthorized access attempts are logged and reported.</p>
            </div>
        </div>
    );
}








