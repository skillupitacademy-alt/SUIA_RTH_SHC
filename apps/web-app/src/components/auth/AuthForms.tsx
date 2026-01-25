'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { apiClient } from '@quiz/api-client';

export function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Real API Call
            const { user, accessToken } = await apiClient.auth.login(
                (e.target as any).email.value,
                (e.target as any).password.value
            );

            login(user, accessToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || "Invalid credentials. Please try again.");
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

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                            Password
                        </label>
                        <div className="relative mt-1.5">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                    className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-11"
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
    const router = useRouter(); // Added missing router

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { user, accessToken } = await apiClient.auth.signup(
                (e.target as any).email.value,
                (e.target as any).password.value,
                (e.target as any).name.value
            );

            useAuthStore.getState().login(user, accessToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || "Failed to create account.");
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
                            type="password"
                            placeholder="••••••••"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 h-11"
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
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const email = (e.target as any).email.value;
            await apiClient.auth.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            // Success is true still as per contract "Always show neutral success message" 
            // but we might want to log server errors in console for debugging
            console.error("Forgot password request error:", err.message);
            // According to contract "Always neutral", we only show error for network errors/server errors if it truly fails to send
            setSuccess(true);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-md space-y-8 p-10 bg-background border rounded-3xl shadow-sm text-center">
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
                        type="email"
                        placeholder="name@example.com"
                        className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 h-12"
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

    const router = useRouter();

    // 1. Validate token on mount
    useEffect(() => {
        const validate = async () => {
            try {
                const { valid } = await apiClient.auth.validateResetToken(token);
                setIsValid(valid);
            } catch (err) {
                setIsValid(false);
            } finally {
                setValidating(false);
            }
        };
        validate();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const password = (e.target as any).password.value;
        const confirm = (e.target as any).confirm.value;

        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
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
        } catch (err: any) {
            setError(err.message || "Unable to reset password. Please try again.");
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
            <div className="w-full max-w-md p-10 bg-background border rounded-3xl shadow-sm text-center">
                <div className="p-4 rounded-2xl bg-red-50 text-red-700 font-medium">
                    This password reset link is invalid or has expired.
                </div>
                <div className="mt-8 space-y-4">
                    <Link href="/forgot-password" className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
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
            <div className="w-full max-w-md p-10 bg-background border rounded-3xl shadow-sm text-center">
                <div className="p-4 rounded-2xl bg-green-50 text-green-700 font-medium">
                    Your password has been reset successfully. You can now sign in.
                </div>
                <Link href="/login" className="inline-flex w-full mt-8 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
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
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold leading-none" htmlFor="confirm">Confirm Password</label>
                        <input
                            id="confirm"
                            type="password"
                            placeholder="••••••••"
                            className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 text-xs font-medium bg-red-50 text-red-600 rounded-lg">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 h-12"
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

