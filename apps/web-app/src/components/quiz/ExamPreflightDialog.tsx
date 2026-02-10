import { useState, useEffect } from 'react';
import { ZLoader } from '@quiz/ui';
// import { ZLoader } from '../../../../../packages/ui/src/ZLoader';
import { useRouter } from 'next/navigation';
import { apiClient } from '@quiz/api-client';
import { ShieldCheck, Wifi, UserCheck, Database, FileKey, AlertTriangle, ArrowRight, RotateCw } from 'lucide-react';

interface PreflightCheck {
    id: string;
    label: string;
    status: 'pending' | 'running' | 'success' | 'error' | 'warning';
    icon: any;
}

interface ExamPreflightDialogProps {
    isOpen: boolean;
    onSuccess: () => void;
    onClose: () => void;
}

export function ExamPreflightDialog({ isOpen, onSuccess, onClose }: ExamPreflightDialogProps) {
    const router = useRouter();
    const [checks, setChecks] = useState<PreflightCheck[]>([
        { id: 'session', label: 'Verifying Identity', status: 'pending', icon: UserCheck },
        { id: 'csrf', label: 'Securing Connection', status: 'pending', icon: ShieldCheck },
        { id: 'network', label: 'Checking Connectivity', status: 'pending', icon: Wifi },
        { id: 'storage', label: 'Preparing Local Backup', status: 'pending', icon: Database },
    ]);
    const [overallStatus, setOverallStatus] = useState<'running' | 'success' | 'error'>('running');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            runChecks();
        }
    }, [isOpen]);

    const updateCheck = (id: string, status: PreflightCheck['status']) => {
        setChecks(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    };

    const runChecks = async () => {
        setOverallStatus('running');
        setErrorMsg(null);
        setChecks(prev => prev.map(c => ({ ...c, status: 'pending' })));

        try {
            // 1. Session Refresh
            updateCheck('session', 'running');
            try {
                await apiClient.auth.refresh(); // Assuming this exists or using /auth/me
                updateCheck('session', 'success');
            } catch (err) {
                updateCheck('session', 'error');
                throw new Error('Session validation failed. Please log in again.');
            }

            // 2. CSRF / Network Ping
            updateCheck('csrf', 'running');
            updateCheck('network', 'running');
            try {
                // Just pinging an auth route ensures cookies are sent and CSRF is valid (or refreshed by self-healing)
                await apiClient.auth.getSession();
                updateCheck('csrf', 'success');
                updateCheck('network', 'success');
            } catch (err) {
                updateCheck('csrf', 'error');
                updateCheck('network', 'error');
                throw new Error('Unable to establish secure connection.');
            }

            // 3. Storage Check
            updateCheck('storage', 'running');
            try {
                localStorage.setItem('__preflight_test__', 'ok');
                localStorage.removeItem('__preflight_test__');
                updateCheck('storage', 'success');
            } catch (err) {
                // Warning only - allow continue
                updateCheck('storage', 'warning');
            }

            // Success!
            setOverallStatus('success');
            setTimeout(() => {
                onSuccess();
            }, 1000);

        } catch (err: any) {
            setOverallStatus('error');
            setErrorMsg(err.message || 'Pre-flight checklist failed.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-8">

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                        <ShieldCheck className="w-6 h-6 text-slate-900" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">System Check</h2>
                    <p className="text-sm text-slate-500 mt-1">Verifying exam environment integrity...</p>
                </div>

                <div className="space-y-4 mb-8">
                    {checks.map((check) => (
                        <div key={check.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                                <check.icon className={`w-4 h-4 ${check.status === 'success' ? 'text-green-600' :
                                    check.status === 'error' ? 'text-red-600' :
                                        check.status === 'warning' ? 'text-amber-600' :
                                            'text-slate-400'
                                    }`} />
                                <span className={`text-sm font-medium ${check.status === 'success' ? 'text-slate-900' : 'text-slate-600'
                                    }`}>{check.label}</span>
                            </div>

                            {check.status === 'running' && <ZLoader size="xs" />}
                            {check.status === 'success' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                            {check.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                            {check.status === 'warning' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                            {check.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-200" />}
                        </div>
                    ))}
                </div>

                {overallStatus === 'error' && (
                    <div className={`${errorMsg?.includes('Session') ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-red-50 text-red-900 border-red-200'} p-4 rounded-xl text-sm mb-6 flex items-start gap-2 border`}>
                        <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${errorMsg?.includes('Session') ? 'text-amber-600' : 'text-red-600'}`} />
                        <div>
                            <p className="font-bold">{errorMsg?.includes('Session') ? 'Identity Expired' : 'Check Failed'}</p>
                            <p>{errorMsg}</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    {overallStatus === 'error' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (errorMsg?.includes('Session') || errorMsg?.includes('log in')) {
                                        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}&reason=session_expired`);
                                    } else {
                                        runChecks();
                                    }
                                }}
                                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {errorMsg?.includes('Session') || errorMsg?.includes('log in') ? 'Sign In' : 'Retry Check'} <RotateCw className="w-4 h-4" />
                            </button>
                        </>
                    ) : overallStatus === 'success' ? (
                        <div className="w-full py-2 flex items-center justify-center gap-2 text-green-600 font-bold text-sm bg-green-50 rounded-lg">
                            All Systems Go <ArrowRight className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="w-full py-2 text-center text-xs text-slate-400 font-medium uppercase tracking-widest">
                            Running Diagnostics...
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
