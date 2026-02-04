'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import { ZLoader } from '@/components/ui/ZLoader';
import Link from 'next/link';

export default function AdminLoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // STRICT BOUNDARY: Use Admin Client (hits /api/admin/auth/login)
            const { user } = await apiClient.admin.login(formData.email, formData.password);

            // Redundant check (API should handle this), but safe for UI
            if (!user.isAdmin) {
                throw new Error("Access Denied: Governance Privileges Required.");
            }

            login(user);
            router.push('/');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight mb-2">Welcome Back</h2>
                <p className="text-muted-foreground">Authenticate to access the governance terminal.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold flex items-center gap-2">
                    <ShieldCheck size={16} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-muted-foreground h-5 w-5" />
                        <input
                            type="email"
                            required
                            className="w-full pl-12 pr-4 py-3 rounded-xl border bg-muted/30 text-foreground focus:bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                            placeholder="admin@quizplatform.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Password</label>
                        <Link
                            href="/forgot-password"
                            className="text-[10px] font-black uppercase tracking-widest text-[#FF4B91] hover:underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-muted-foreground h-5 w-5" />
                        <input
                            type="password"
                            required
                            className="w-full pl-12 pr-4 py-3 rounded-xl border bg-muted/30 text-foreground focus:bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                            placeholder="••••••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black tracking-wide shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
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

            <div className="mt-8 pt-8 border-t text-center text-xs text-muted-foreground">
                <p>Restricted Access System v1.0.4</p>
                <p className="mt-1">Unauthorized access attempts are logged and reported.</p>
            </div>
        </div>
    );
}
