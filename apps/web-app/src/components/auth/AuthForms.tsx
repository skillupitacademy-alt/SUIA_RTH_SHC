'use client';
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { apiClient } from '@quiz/api-client';
import { recordClientMetric, METRICS } from '@quiz/observability';
import { Button, Input, ZLoader } from '@quiz/ui';


export function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const login = useAuthStore((s) => s.login);
    const router = useRouter();

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

            // Real API Call
            apiClient.client.setPortalIdentity('user');
            const { user } = await apiClient.auth.login(email, password);
            if (!user) throw new Error("Login succeeded but no user data was returned.");
            login({ ...user, onboarded: user.onboarded ?? false });
            await recordClientMetric(METRICS.AUTH.LOGIN, 1, { method: 'email', outcome: 'success' });
            // CRITICAL: Use full page navigation, NOT client-side router.push.
            // DashboardPage is a Server Component (T79 refactor) that reads cookies
            // via getServerSession(). Client-side navigation (router.push) doesn't
            // properly propagate cookies for server component rendering, causing
            // a blank dashboard. A full page load ensures cookies are sent correctly.
            window.location.href = '/dashboard';
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
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        label="Email Address"
                        placeholder="name@example.com"
                        autoComplete="username"
                        required
                    />
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                minLength={1}
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
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

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11"
                >
                    {loading ? <ZLoader size="xs" className="text-white" center={false} /> : "Sign In"}
                </Button>
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
            const { user } = await apiClient.auth.signup(email, password, name);
            if (!user) throw new Error("Account created but failed to log you in automatically.");

            useAuthStore.getState().login({ ...user, onboarded: user.onboarded ?? false });
            // Same as LoginForm: full page load needed for server component cookie access
            window.location.href = '/dashboard';
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
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        label="Full Name"
                        placeholder="John Doe"
                        required
                    />
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        label="Email Address"
                        placeholder="name@example.com"
                        required
                    />
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        label="Password"
                        placeholder="••••••••"
                        minLength={1}
                        required
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11"
                >
                    {loading ? <ZLoader size="xs" className="text-white" center={false} /> : "Sign Up"}
                </Button>
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
            await apiClient.auth.forgotPassword(email);
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
                <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="name@example.com"
                    required
                />

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12"
                >
                    {loading ? <ZLoader size="xs" className="text-white" center={false} /> : "Send reset link"}
                </Button>
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
                const { valid } = await apiClient.auth.validateResetToken(token);
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
            await apiClient.auth.resetPassword(token, password);
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
                    <div className="space-y-2">
                        <label className="text-sm font-bold leading-none" htmlFor="password">New Password</label>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                minLength={1}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <Input
                        id="confirm"
                        name="confirm"
                        type="password"
                        label="Confirm Password"
                        placeholder="••••••••"
                        minLength={1}
                        required
                    />
                </div>

                {error && (
                    <div className="p-3 text-xs font-medium bg-red-50 text-red-600 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12"
                >
                    {loading ? <ZLoader size="xs" className="text-white" center={false} /> : "Reset password"}
                </Button>
            </form>

            <div className="text-center text-sm">
                <Link href="/login" className="font-bold text-primary hover:underline">Back to login</Link>
            </div>
        </div>
    );
}
