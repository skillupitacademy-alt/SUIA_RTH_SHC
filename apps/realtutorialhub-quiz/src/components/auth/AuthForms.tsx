'use client';
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient, normalizeSkillHubUser } from '@quiz/api-client';
import { recordClientMetric, METRICS } from '@quiz/observability';
import { getApiBase } from '@/utils/apiBase';

const PORTAL_BRAND = 'realtutorialhub' as const;

const LOGIN_ENDPOINT = `${getApiBase()}/auth/login`;

type LoginResponse = {
    accessToken?: string;
    refreshToken?: string;
    user?: {
        id?: string;
        name?: string;
        email?: string;
        role?: string;
        roles?: string[];
        platforms?: string[];
        subscriptions?: string[];
    };
    error?: string;
    message?: string;
    _error?: string;
};

function normalizeRedirectTarget(rawTarget: string | null): string {
    if (typeof rawTarget === 'string' && rawTarget.startsWith('/') && !rawTarget.startsWith('//')) {
        return rawTarget;
    }

    return '/dashboard';
}

function getLoginErrorMessage(response: Response | null, payload: LoginResponse | null, fallback: string): string {
    const candidate = payload?.error ?? payload?.message ?? payload?._error;

    if (response !== null && response.status === 401) {
        const trimmed = typeof candidate === 'string' ? candidate.trim() : '';
        return trimmed.length > 0 && !/^invalid credentials$/i.test(trimmed) ? trimmed : 'Invalid credentials';
    }

    if (response !== null && response.status === 403) {
        const trimmed = typeof candidate === 'string' ? candidate.trim() : '';
        return trimmed.length > 0 && !/^forbidden$/i.test(trimmed)
            ? trimmed
            : 'Access denied: this account is not permitted for this portal.';
    }

    if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
    }

    return fallback;
}

export function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const login = useAuthStore((s) => s.login);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTarget = normalizeRedirectTarget(searchParams.get('redirect'));

    const toErrorMessage = (err: unknown): string => {
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
            return 'Network/CORS block: unable to reach the API. Check allowed origins and portal headers.';
        }
        if (err && typeof err === 'object') {
            const maybe = err as { _error?: string; message?: string };
            if (maybe._error) return maybe._error;
            if (maybe.message) return maybe.message;
        }
        return "Invalid credentials. Please try again.";
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData(e.currentTarget);
            const email = formData.get('email')?.toString() ?? '';
            const password = formData.get('password')?.toString() ?? '';

            const response = await fetch(LOGIN_ENDPOINT, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    'x-portal-identity': 'user',
                    'x-brand': 'realtutorialhub',
                },
                body: JSON.stringify({
                    email,
                    password,
                    platform: 'realtutorialhub',
                }),
            });

            const payload = (await response.json().catch(() => null)) as LoginResponse | null;

            if (!response.ok) {
                throw new Error(getLoginErrorMessage(response, payload, 'Authentication failed'));
            }

            // API server already set httpOnly cookies via Set-Cookie header.
            // We do NOT create client-side cookies to avoid scope conflicts.
            const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';

            if (accessToken.length === 0) {
                throw new Error('Authentication failed: missing access token.');
            }

            const user = payload?.user;
            if (user !== undefined) {
                login(normalizeSkillHubUser(user, email));
            }
            await recordClientMetric(METRICS.AUTH.LOGIN, 1, { method: 'email', outcome: 'success' });
            router.push(redirectTarget);
        } catch (err: unknown) {
            setError(toErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-8 p-8 bg-background border rounded-2xl shadow-sm">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                <p className="mt-2 text-muted-foreground">Please enter your details to sign in</p>
            </div>

            {error && (
                <div className="p-3 text-sm font-medium bg-red-50 text-red-600 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="off">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium leading-none" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            autoComplete="username"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium leading-none" htmlFor="password">
                            Password
                        </label>
                        <div className="relative mt-1.5">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                minLength={1}
                                autoComplete="new-password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="remember" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="remember" className="text-sm font-medium leading-none">Remember me</label>
                    </div>
                    <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 h-11 transition-all"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                </button>
            </form>

            <div className="text-center text-sm">
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <Link href="/signup" className="font-bold text-primary hover:underline">Create an account</Link>
            </div>
        </div>
    );
}

export function SignupForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData(e.currentTarget);
            const email = formData.get('email')?.toString() ?? '';
            const password = formData.get('password')?.toString() ?? '';
            const name = formData.get('name')?.toString() ?? '';

            apiClient.client.setPortalIdentity('user');
            const { user } = await apiClient.auth.signup(email, password, name, PORTAL_BRAND);
            if (!user) throw new Error("Account created but failed to log you in automatically.");

            useAuthStore.getState().login(normalizeSkillHubUser(user, user.email));
            router.push('/dashboard');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create account.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-8 p-8 bg-background border rounded-2xl shadow-sm">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
                <p className="mt-2 text-muted-foreground">Enter your details to get started</p>
            </div>

            {error && (
                <div className="p-3 text-sm font-medium bg-red-50 text-red-600 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium leading-none" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium leading-none" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            minLength={1}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 h-11 transition-all"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
                </button>
            </form>

            <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="font-bold text-primary hover:underline">Sign in</Link>
            </div>
        </div>
    );
}

export function ForgotPasswordForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const email = formData.get('email')?.toString() ?? '';
            await apiClient.auth.forgotPassword(email, PORTAL_BRAND);
            setSuccess(true);
        } catch {
            // Always show neutral success message to prevent email enumeration
            setSuccess(true);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-md space-y-8 p-10 bg-background border rounded-3xl shadow-sm text-center border-green-100">
                <div className="p-4 rounded-2xl bg-green-50 text-green-700 font-medium">
                    If an account exists for this email, a password reset link has been sent.
                </div>
                <Link href="/login" className="inline-block mt-4 text-sm font-bold text-primary hover:underline">
                    Back to login
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md space-y-8 p-10 bg-background border rounded-3xl shadow-sm">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold tracking-tight">Forgot password?</h2>
                <p className="mt-2 text-muted-foreground">Enter your email to receive a reset link</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label className="text-sm font-bold leading-none" htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 h-12 transition-all"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send reset link"}
                </button>
            </form>

            <div className="text-center text-sm">
                <Link href="/login" className="font-bold text-primary hover:underline">Back to login</Link>
            </div>
        </div>
    );
}

export function ResetPasswordForm({ token }: { token: string }) {
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const validate = async () => {
            try {
                const { valid } = await apiClient.auth.validateResetToken(token, PORTAL_BRAND);
                setIsValid(valid);
            } catch {
                setIsValid(false);
            } finally {
                setValidating(false);
            }
        };
        validate();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const password = formData.get('password')?.toString() ?? '';
        const confirm = formData.get('confirm')?.toString() ?? '';

        if (password.length < 1) {
            setError("Password is required");
            return;
        }

        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiClient.auth.resetPassword(token, password, PORTAL_BRAND);
            setSuccess(true);
        } catch {
            setError("Unable to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="w-full max-w-md p-10 bg-background border rounded-3xl shadow-sm text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Validating reset link...</p>
            </div>
        );
    }

    if (!isValid) {
        return (
            <div className="w-full max-w-md p-10 bg-background border rounded-3xl shadow-sm text-center border-red-100">
                <div className="p-4 rounded-2xl bg-red-50 text-red-700 font-medium">
                    This password reset link is invalid or has expired.
                </div>
                <div className="mt-8 space-y-4">
                    <Link href="/forgot-password" className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all">
                        Request a new reset link
                    </Link>
                    <Link href="/login" className="block text-sm font-bold text-muted-foreground hover:text-foreground">
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="w-full max-w-md p-10 bg-background border rounded-3xl shadow-sm text-center border-green-100">
                <div className="p-4 rounded-2xl bg-green-50 text-green-700 font-medium">
                    Your password has been reset successfully. You can now sign in.
                </div>
                <Link href="/login" className="inline-flex w-full mt-8 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all">
                    Go to login
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md space-y-8 p-10 bg-background border rounded-3xl shadow-sm">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold tracking-tight">Set a new password</h2>
                <p className="mt-2 text-muted-foreground">Choose a strong password for your account</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-bold leading-none" htmlFor="password">New Password</label>
                        <div className="relative mt-2">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                minLength={1}
                                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold leading-none" htmlFor="confirm">Confirm Password</label>
                        <input
                            id="confirm"
                            name="confirm"
                            type="password"
                            placeholder="••••••••"
                            minLength={1}
                            className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 text-xs font-medium bg-red-50 text-red-600 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 h-12 transition-all"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset password"}
                </button>
            </form>

            <div className="text-center text-sm">
                <Link href="/login" className="font-bold text-primary hover:underline">Back to login</Link>
            </div>
        </div>
    );
}
