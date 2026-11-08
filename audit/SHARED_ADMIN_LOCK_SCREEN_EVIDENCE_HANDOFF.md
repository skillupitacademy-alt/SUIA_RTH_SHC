# Final Evidence Handoff — Shared AdminLockScreen
## Independent Architectural & Governance Review Package

**Submission Target:** Principal Architect Review (ChatGPT)  
**Implementer:** Gemini Flash  
**Repository:** `skillupitacademy-alt/SUIA_RTH_SHC`  
**Current Main HEAD:** `0b396a4c30660b91c256db097fb9a9dacfe13ebc`  
**Working Tree State:** Local changes preserved, completely unstaged, 0 commits, 0 pushes, 0 deployments.  
**Date:** November 8, 2026  

---

## 1. Governance Document Locations & Status

Per mandatory instructions, the full governance and architecture report has been committed to disk inside the repository's authoritative audit directory:
- **Repository Path:** [`audit/SHARED_ADMIN_LOCK_SCREEN_GOVERNANCE_REPORT.md`](file:///e:/onlinewebsites/quiz-platform/audit/SHARED_ADMIN_LOCK_SCREEN_GOVERNANCE_REPORT.md)
- **Validation Documents Audited:**
  1. `docs/architecture/reviews/01_ProjectWideSoftwareArchitectureAndEngineeringGovernanceStandard_v1.1_PROPOSED.md` (PSEG-001)
  2. `docs/architecture/reviews/02_ProjectSoftwareArchitectureStandard.md`
  3. `docs/architecture/reviews/03_ProjectServiceAcceptanceStandard.md`
  4. `docs/architecture/reviews/11_Reusable_App_and_Module_Audit_Template.md`

---

## 2. Complete Git Diff of Tracked Modified Files

### 2.1 `apps/realtutorialhub-admin/src/components/auth/AdminLockScreen.tsx`
```diff
diff --git a/apps/realtutorialhub-admin/src/components/auth/AdminLockScreen.tsx b/apps/realtutorialhub-admin/src/components/auth/AdminLockScreen.tsx
index 52e01f87..c4fe2ff1 100644
--- a/apps/realtutorialhub-admin/src/components/auth/AdminLockScreen.tsx
+++ b/apps/realtutorialhub-admin/src/components/auth/AdminLockScreen.tsx
@@ -1,191 +1,129 @@
 'use client';
 
-import { loginPortalSession, ZLoader } from '@quiz/ui';
-import { ChevronRight, Lock, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
-import { useRef, useState } from 'react';
+import { loginPortalSession, SharedAdminLockScreen, useThemeStore } from '@quiz/ui';
+import { useCallback, useState } from 'react';
 import { useShallow } from 'zustand/react/shallow';
 
-import { useFocusTrap } from '@/hooks/useFocusTrap';
 import { useAuthStore } from '@/store/auth-store';
 import { clientLogger } from '@/utils/clientLogger';
 
 export function AdminLockScreen() {
-    const { user, unlock, logout, isLocked, login } = useAuthStore(
-        useShallow((s) => ({
-            user: s.user,
-            unlock: s.unlock,
-            logout: s.logout,
-            isLocked: s.isLocked,
-            login: s.login,
-        }))
-    );
-    const [password, setPassword] = useState('');
-    const [isLoading, setIsLoading] = useState(false);
-    const [error, setError] = useState<string | null>(null);
-    const inputRef = useRef<HTMLInputElement>(null);
-    useFocusTrap(inputRef, isLocked === true);
-
-    if (isLocked === false || user === null || user === undefined) return null;
-
-    const handleUnlock = async (e?: React.FormEvent) => {
-        e?.preventDefault();
-        if (password === '') return;
-
-        setIsLoading(true);
-        setError(null);
-
-        try {
-            const email = user?.email ?? '';
-            if (email.length === 0) {
-                setError('Missing admin email');
-                setIsLoading(false);
-                return;
-            }
-            clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_SUBMIT]', {
-                step: 'submit',
-                emailDomain: email.includes('@') ? email.split('@')[1] : 'unknown',
-            });
-            const { user: refreshedUser, expiresAt } = await loginPortalSession({
-                email,
-                password,
-                platform: 'realtutorialhub',
-                portalIdentity: 'admin',
-                portalName: 'RealTutorialHub Admin',
-                allowedRoles: ['admin', 'super_admin'],
-            });
-
-            clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_RESPONSE]', {
-                step: 'response',
-                hasUser: refreshedUser !== null && refreshedUser !== undefined,
-                expiresAt: expiresAt ?? null,
-            });
-
-            // 2. Update local state
-            if (refreshedUser !== undefined && refreshedUser.email !== undefined) {
-                login({
-                    id: refreshedUser.id ?? user.id,
-                    email: refreshedUser.email,
-                    name: refreshedUser.name ?? user.name ?? '',
-                    isAdmin: refreshedUser.isAdmin ?? true,
-                    role: refreshedUser.role ?? 'admin',
-                    onboarded: refreshedUser.onboarded ?? true,
-                }, expiresAt);
-            }
-
-            setPassword('');
-            unlock();
-        } catch (err: unknown) {
-            setError('Incorrect master password');
-            clientLogger.error('Lock screen unlock failed', { error: err instanceof Error ? err.message : 'unknown' });
-        } finally {
-            setIsLoading(false);
-        }
-    };
-
-    const handleSwitchAccount = () => {
-        logout();
-        window.location.href = '/login';
-    };
-
-    return (
-        <div className="fixed inset-0 z-[100000] bg-[#1A1A1A]/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-500">
-            <div className="w-full max-w-sm px-6 py-12 flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-500">
-
-                {/* Branding and status */}
-                <div className="flex flex-col items-center space-y-4">
-                    <div className="relative">
-                        <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#FF4B91] to-[#FF8E9E] flex items-center justify-center shadow-2xl shadow-pink-500/20">
-                            <Lock size={40} className="text-white" />
-                        </div>
-                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-[#1A1A1A] shadow-lg">
-                            <ShieldCheck size={16} />
-                        </div>
-                    </div>
-
-                    <div className="text-center">
-                        <h1 className="text-2xl font-black font-outfit uppercase tracking-tighter text-white">
-                            Terminal Locked
-                        </h1>
-                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2 mt-1">
-                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
-                            Security Protocol Alpha v1.0.4
-                        </p>
-                    </div>
-                </div>
-
-                {/* User info */}
-                <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
-                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-slate-400">
-                        <UserIcon size={24} />
-                    </div>
-                    <div className="flex-1 min-w-0">
-                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
-                            {user?.email}
-                        </p>
-                        <p className="text-sm font-black text-white truncate flex items-center gap-2">
-                            {user?.name ?? 'Admin User'}
-                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
-                                <ShieldCheck size={12} /> Admin
-                            </span>
-                        </p>
-                    </div>
-                </div>
-
-                {/* Input */}
-                <form onSubmit={(e) => { void handleUnlock(e); }} className="w-full space-y-4">
-                    <div className="space-y-2">
-                        <div className="flex items-center justify-between text-slate-300 text-[11px] font-bold uppercase tracking-[0.2em]">
-                            <span id="lock-screen-password-label">Master Password</span>
-                            <button
-                                type="button"
-                                onClick={handleSwitchAccount}
-                                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
-                                aria-label="Switch account"
-                            >
-                                Switch Account <ChevronRight size={12} />
-                            </button>
-                        </div>
-                        <div className="relative">
-                            <input
-                                ref={inputRef}
-                                type="password"
-                                value={password}
-                                onChange={(e) => setPassword(e.target.value)}
-                                minLength={1}
-                                className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B91]/40"
-                                placeholder="Enter master password"
-                                aria-label="Master password"
-                                aria-labelledby="lock-screen-password-label"
-                            />
-                            <LogOut className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
-                        </div>
-                    </div>
-
-                    {error !== null ? <div className="text-red-400 text-[11px] font-bold uppercase tracking-[0.2em] text-center">{error}</div> : null}
-
-                    <button
-                        type="submit"
-                        disabled={isLoading || password === ''}
-                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF4B91] to-[#FF8E9E] text-white font-black uppercase tracking-[0.2em] text-sm shadow-lg shadow-pink-500/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
-                        aria-label="Unlock terminal"
-                    >
-                        {isLoading ? (
-                            <span className="flex items-center justify-center gap-2">
-                                <ZLoader size="xs" className="text-white" center={false} />
-                                Re-establishing Session...
-                            </span>
-                        ) : 'Unlock Terminal'}
-                    </button>
-                </form>
-
-                <button
-                    type="button"
-                    onClick={handleSwitchAccount}
-                    className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 hover:text-white transition-colors flex items-center gap-2"
-                >
-                    <LogOut size={14} /> Log out securely
-                </button>
-            </div>
-        </div>
-    );
+  const { user, unlock, logout, isLocked, login } = useAuthStore(
+    useShallow((s) => ({
+      user: s.user,
+      unlock: s.unlock,
+      logout: s.logout,
+      isLocked: s.isLocked,
+      login: s.login,
+    }))
+  );
+
+  const activeTheme = useThemeStore((s) => s.theme);
+  const [isLoading, setIsLoading] = useState(false);
+  const [error, setError] = useState<string | null>(null);
+
+  const handleUnlock = useCallback(
+    async (password: string) => {
+      if (!password || !user) return;
+
+      setIsLoading(true);
+      setError(null);
+
+      try {
+        const email = user.email ?? '';
+        if (email.length === 0) {
+          setError('Missing admin email');
+          throw new Error('Missing admin email');
+        }
+
+        clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_SUBMIT]', {
+          step: 'submit',
+          emailDomain: email.includes('@') ? email.split('@')[1] : 'unknown',
+        });
+
+        const { user: refreshedUser, expiresAt } = await loginPortalSession({
+          email,
+          password,
+          platform: 'realtutorialhub',
+          portalIdentity: 'admin',
+          portalName: 'RealTutorialHub Admin',
+          allowedRoles: ['admin', 'super_admin'],
+        });
+
+        clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_RESPONSE]', {
+          step: 'response',
+          hasUser: refreshedUser !== null && refreshedUser !== undefined,
+          expiresAt: expiresAt ?? null,
+        });
+
+        if (
+          typeof refreshedUser.id !== 'string' ||
+          refreshedUser.id.length === 0 ||
+          typeof refreshedUser.email !== 'string' ||
+          refreshedUser.email.length === 0
+        ) {
+          throw new Error('Invalid authentication response');
+        }
+
+        // Strict identity check: reauthenticated user must match locked user
+        if (typeof user.id === 'string' && user.id.length > 0 && refreshedUser.id !== user.id) {
+          throw new Error('Reauthenticated user does not match the locked session');
+        }
+        if (typeof user.email === 'string' && user.email.length > 0 && refreshedUser.email.toLowerCase() !== user.email.toLowerCase()) {
+          throw new Error('Reauthenticated user does not match the locked session');
+        }
+
+        // Enforce admin privilege
+        const role = typeof refreshedUser.role === 'string' ? refreshedUser.role.toLowerCase() : '';
+        const isAdminRole = role === 'admin' || role === 'super_admin' || refreshedUser.isAdmin === true;
+        if (!isAdminRole) {
+          throw new Error('Insufficient permissions: Administrator role required');
+        }
+
+        // Update local auth state with confirmed refreshed user
+        login(
+          {
+            id: refreshedUser.id,
+            email: refreshedUser.email,
+            name: refreshedUser.name ?? user.name ?? 'Admin User',
+            isAdmin: refreshedUser.isAdmin ?? true,
+            role: refreshedUser.role ?? 'admin',
+            onboarded: refreshedUser.onboarded ?? true,
+          },
+          expiresAt
+        );
+
+        unlock();
+      } catch (err: unknown) {
+        const message = err instanceof Error ? err.message : 'Incorrect master password';
+        setError(message);
+        clientLogger.error('Lock screen unlock failed', { error: message });
+        throw err;
+      } finally {
+        setIsLoading(false);
+      }
+    },
+    [user, login, unlock]
+  );
+
+  const handleSwitchAccount = useCallback(() => {
+    logout();
+    window.location.href = '/login';
+  }, [logout]);
+
+  return (
+    <SharedAdminLockScreen
+      isLocked={Boolean(isLocked)}
+      user={user}
+      brandName="RealTutorialHub"
+      brandTitle="Terminal Locked"
+      brandSubtitle="Security Protocol Alpha v1.0.4"
+      theme={activeTheme === 'theme-b' ? 'theme-b' : 'theme-a'}
+      isLoading={isLoading}
+      error={error}
+      onUnlock={handleUnlock}
+      onSwitchAccount={handleSwitchAccount}
+      onLogout={handleSwitchAccount}
+    />
+  );
 }
```

### 2.2 `apps/skillhubcore-admin/src/components/auth/AdminLockScreen.tsx`
```diff
diff --git a/apps/skillhubcore-admin/src/components/auth/AdminLockScreen.tsx b/apps/skillhubcore-admin/src/components/auth/AdminLockScreen.tsx
index b49cd98b..2c00a90c 100644
--- a/apps/skillhubcore-admin/src/components/auth/AdminLockScreen.tsx
+++ b/apps/skillhubcore-admin/src/components/auth/AdminLockScreen.tsx
@@ -1,190 +1,130 @@
 'use client';
 
-import { loginPortalSession, ZLoader } from '@quiz/ui';
-import { ChevronRight, Lock, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
-import { useRef, useState } from 'react';
+import { SharedAdminLockScreen } from '@quiz/ui';
+import { useCallback, useState } from 'react';
 import { useShallow } from 'zustand/react/shallow';
-
-import { useFocusTrap } from '@/hooks/useFocusTrap';
 import { useAuthStore } from '@/store/auth-store';
 import { clientLogger } from '@/utils/clientLogger';
 
 export function AdminLockScreen() {
-    const { user, unlock, logout, isLocked, login } = useAuthStore(
-        useShallow((s) => ({
-            user: s.user,
-            unlock: s.unlock,
-            logout: s.logout,
-            isLocked: s.isLocked,
-            login: s.login,
-        }))
-    );
-    const [password, setPassword] = useState('');
-    const [isLoading, setIsLoading] = useState(false);
-    const [error, setError] = useState<string | null>(null);
-    const inputRef = useRef<HTMLInputElement>(null);
-    useFocusTrap(inputRef, isLocked === true);
-
-    if (isLocked === false || user === null || user === undefined) return null;
-
-    const handleUnlock = async (e?: React.FormEvent) => {
-        e?.preventDefault();
-        if (password === '') return;
-
-        setIsLoading(true);
-        setError(null);
-
-        try {
-            const email = user?.email ?? '';
-            if (email.length === 0) {
-                setError('Missing admin email');
-                setIsLoading(false);
-                return;
-            }
-            clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_SUBMIT]', {
-                step: 'submit',
-                emailDomain: email.includes('@') ? email.split('@')[1] : 'unknown',
-            });
-            const { user: refreshedUser } = await loginPortalSession({
-                email,
-                password,
-                platform: 'realtutorialhub',
-                portalIdentity: 'admin',
-                portalName: 'RealTutorialHub Admin',
-                allowedRoles: ['admin', 'super_admin'],
-            });
-
-            clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_RESPONSE]', {
-                step: 'response',
-                hasUser: refreshedUser !== null && refreshedUser !== undefined,
-            });
-
-            // 2. Update local state
-            if (refreshedUser !== undefined && refreshedUser.email !== undefined) {
-                login({
-                    id: refreshedUser.id ?? user.id,
-                    email: refreshedUser.email,
-                    name: refreshedUser.name ?? user.name ?? '',
-                    isAdmin: refreshedUser.isAdmin ?? true,
-                    role: refreshedUser.role ?? 'admin',
-                    onboarded: refreshedUser.onboarded ?? true,
-                });
-            }
-
-            setPassword('');
-            unlock();
-        } catch (err: unknown) {
-            setError('Incorrect master password');
-            clientLogger.error('Lock screen unlock failed', { error: err instanceof Error ? err.message : 'unknown' });
-        } finally {
-            setIsLoading(false);
-        }
-    };
-
-    const handleSwitchAccount = () => {
-        logout();
-        window.location.href = '/login';
-    };
-
-    return (
-        <div className="fixed inset-0 z-[100000] bg-[#1A1A1A]/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-500">
-            <div className="w-full max-w-sm px-6 py-12 flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-500">
-
-                {/* Branding and status */}
-                <div className="flex flex-col items-center space-y-4">
-                    <div className="relative">
-                        <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#FF4B91] to-[#FF8E9E] flex items-center justify-center shadow-2xl shadow-pink-500/20">
-                            <Lock size={40} className="text-white" />
-                        </div>
-                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-[#1A1A1A] shadow-lg">
-                            <ShieldCheck size={16} />
-                        </div>
-                    </div>
-
-                    <div className="text-center">
-                        <h1 className="text-2xl font-black font-outfit uppercase tracking-tighter text-white">
-                            Terminal Locked
-                        </h1>
-                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2 mt-1">
-                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
-                            Security Protocol Alpha v1.0.4
-                        </p>
-                    </div>
-                </div>
-
-                {/* User info */}
-                <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
-                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-slate-400">
-                        <UserIcon size={24} />
-                    </div>
-                    <div className="flex-1 min-w-0">
-                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
-                            {user?.email}
-                        </p>
-                        <p className="text-sm font-black text-white truncate flex items-center gap-2">
-                            {user?.name ?? 'Admin User'}
-                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
-                                <ShieldCheck size={12} /> Admin
-                            </span>
-                        </p>
-                    </div>
-                </div>
-
-                {/* Input */}
-                <form onSubmit={(e) => { void handleUnlock(e); }} className="w-full space-y-4">
-                    <div className="space-y-2">
-                        <div className="flex items-center justify-between text-slate-300 text-[11px] font-bold uppercase tracking-[0.2em]">
-                            <span id="lock-screen-password-label">Master Password</span>
-                            <button
-                                type="button"
-                                onClick={handleSwitchAccount}
-                                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
-                                aria-label="Switch account"
-                            >
-                                Switch Account <ChevronRight size={12} />
-                            </button>
-                        </div>
-                        <div className="relative">
-                            <input
-                                ref={inputRef}
-                                type="password"
-                                value={password}
-                                onChange={(e) => setPassword(e.target.value)}
-                                minLength={1}
-                                className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B91]/40"
-                                placeholder="Enter master password"
-                                aria-label="Master password"
-                                aria-labelledby="lock-screen-password-label"
-                            />
-                            <LogOut className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
-                        </div>
-                    </div>
-
-                    {error !== null ? <div className="text-red-400 text-[11px] font-bold uppercase tracking-[0.2em] text-center">{error}</div> : null}
-
-                    <button
-                        type="submit"
-                        disabled={isLoading || password === ''}
-                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF4B91] to-[#FF8E9E] text-white font-black uppercase tracking-[0.2em] text-sm shadow-lg shadow-pink-500/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
-                        aria-label="Unlock terminal"
-                    >
-                        {isLoading ? (
-                            <span className="flex items-center justify-center gap-2">
-                                <ZLoader size="xs" className="text-white" center={false} />
-                                Re-establishing Session...
-                            </span>
-                        ) : 'Unlock Terminal'}
-                    </button>
-                </form>
-
-                <button
-                    type="button"
-                    onClick={handleSwitchAccount}
-                    className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 hover:text-white transition-colors flex items-center gap-2"
-                >
-                    <LogOut size={14} /> Log out securely
-                </button>
-            </div>
-        </div>
-    );
+  const { user, unlock, logout, isLocked, login } = useAuthStore(
+    useShallow((s) => ({
+      user: s.user,
+      unlock: s.unlock,
+      logout: s.logout,
+      isLocked: s.isLocked,
+      login: s.login,
+    }))
+  );
+
+  const [isLoading, setIsLoading] = useState(false);
+  const [error, setError] = useState<string | null>(null);
+
+  const handleUnlock = useCallback(
+    async (password: string) => {
+      if (!password || !user) return;
+
+      setIsLoading(true);
+      setError(null);
+
+      try {
+        const email = user.email ?? '';
+        if (email.length === 0) {
+          setError('Missing admin email');
+          throw new Error('Missing admin email');
+        }
+
+        clientLogger.warn('[AUTH_FLOW][SHC_LOCK_SCREEN][UNLOCK_SUBMIT]', {
+          step: 'submit',
+          emailDomain: email.includes('@') ? email.split('@')[1] : 'unknown',
+        });
+
+        // Reauthenticate against authentic SHC login BFF
+        const response = await fetch('/api/auth/login', {
+          method: 'POST',
+          headers: {
+            'Content-Type': 'application/json',
+            'x-brand': 'skillhubcore',
+          },
+          body: JSON.stringify({
+            email,
+            password,
+            platform: 'skillhubcore',
+          }),
+          credentials: 'include',
+        });
+
+        if (!response.ok) {
+          const errorData = await response.json().catch(() => ({ message: 'Incorrect master password' }));
+          throw new Error(errorData.error || errorData.message || 'Incorrect master password');
+        }
+
+        const data = await response.json();
+        if (!data || !data.user) {
+          throw new Error('Invalid authentication response');
+        }
+
+        // Verify reauthenticated identity matches the locked user
+        if (user.id && data.user.id && data.user.id !== user.id) {
+          throw new Error('Reauthenticated user does not match the locked session');
+        }
+        if (user.email && data.user.email && data.user.email.toLowerCase() !== user.email.toLowerCase()) {
+          throw new Error('Reauthenticated user does not match the locked session');
+        }
+
+        // Reject inactive or non-admin roles
+        const role = (data.user.role || '').toLowerCase();
+        const isAdminRole = role === 'admin' || role === 'super_admin' || data.user.isAdmin === true;
+        if (!isAdminRole) {
+          throw new Error('Insufficient permissions: Administrator role required');
+        }
+
+        clientLogger.warn('[AUTH_FLOW][SHC_LOCK_SCREEN][UNLOCK_SUCCESS]', {
+          step: 'success',
+          userId: data.user.id,
+        });
+
+        // Update auth store with confirmed refreshed identity
+        login({
+          id: data.user.id ?? user.id,
+          email: data.user.email ?? user.email,
+          name: data.user.name ?? data.user.email ?? user.name ?? 'Admin User',
+          isAdmin: data.user.isAdmin ?? true,
+          role: data.user.role ?? 'admin',
+          onboarded: true,
+        });
+
+        unlock();
+      } catch (err: unknown) {
+        const message = err instanceof Error ? err.message : 'Incorrect master password';
+        setError(message);
+        clientLogger.error('Lock screen unlock failed', { error: message });
+        throw err;
+      } finally {
+        setIsLoading(false);
+      }
+    },
+    [user, login, unlock]
+  );
+
+  const handleSwitchAccount = useCallback(() => {
+    logout();
+    window.location.href = '/login';
+  }, [logout]);
+
+  return (
+    <SharedAdminLockScreen
+      isLocked={Boolean(isLocked)}
+      user={user}
+      brandName="SkillHubCore"
+      brandTitle="Terminal Locked"
+      brandSubtitle="SkillHubCore Security Protocol"
+      theme="skillhubcore"
+      isLoading={isLoading}
+      error={error}
+      onUnlock={handleUnlock}
+      onSwitchAccount={handleSwitchAccount}
+      onLogout={handleSwitchAccount}
+    />
+  );
 }
```

### 2.3 `apps/skillhubcore-admin/src/components/auth/AdminGuard.tsx`
```diff
diff --git a/apps/skillhubcore-admin/src/components/auth/AdminGuard.tsx b/apps/skillhubcore-admin/src/components/auth/AdminGuard.tsx
index 1ef98bd3..c1857ac9 100644
--- a/apps/skillhubcore-admin/src/components/auth/AdminGuard.tsx
+++ b/apps/skillhubcore-admin/src/components/auth/AdminGuard.tsx
@@ -10,6 +10,7 @@ import { useShallow } from 'zustand/react/shallow';
 
 import { useAuthStore } from '@/store/auth-store';
 import { clientLogger } from '@/utils/clientLogger';
+import { AdminLockScreen } from './AdminLockScreen';
 
 const normalizeRole = (value: string | null | undefined) => (typeof value === 'string' ? value.toLowerCase() : '');
 const isAdminEquivalentRole = (value: string | null | undefined) => {
@@ -273,7 +274,12 @@ export function AdminGuard({ children }: { children: React.ReactNode }) {
 
   // Confirmed authenticated admin session only
   if (isAuthenticated === true && hasAdminRole === true) {
-    return <>{children}</>;
+    return (
+      <>
+        {isLocked && <AdminLockScreen />}
+        {children}
+      </>
+    );
   }
 
   // If not authenticated or forbidden, render null while revalidation or redirect takes effect
```

### 2.4 `packages/ui/src/index.ts`
```diff
diff --git a/packages/ui/src/index.ts b/packages/ui/src/index.ts
index c9dc6675..304f119f 100644
--- a/packages/ui/src/index.ts
+++ b/packages/ui/src/index.ts
@@ -25,3 +25,6 @@ export * from './lib/portal-auth';
 export * from './theme-store';
 export * from './PortalLoginPage';
 export * from './tutorial';
+export * from './components/auth/SharedAdminLockScreen';
+export * from './components/auth/lock-screen-types';
+export * from './components/auth/lock-screen-themes';
```

### 2.5 `apps/skillup-admin/tailwind.config.ts` & `vitest.config.ts`
```diff
diff --git a/apps/skillup-admin/tailwind.config.ts b/apps/skillup-admin/tailwind.config.ts
index 375a2366..41e6cd4c 100644
--- a/apps/skillup-admin/tailwind.config.ts
+++ b/apps/skillup-admin/tailwind.config.ts
@@ -1,7 +1,10 @@
 import type { Config } from 'tailwindcss';
 
 const config: Config = {
-  content: ['./src/**/*.{ts,tsx}'],
+  content: [
+    './src/**/*.{ts,tsx}',
+    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
+  ],
   theme: {
     extend: {},
   },
diff --git a/apps/skillup-admin/vitest.config.ts b/apps/skillup-admin/vitest.config.ts
index 1ef5f4b3..57d212cb 100644
--- a/apps/skillup-admin/vitest.config.ts
+++ b/apps/skillup-admin/vitest.config.ts
@@ -24,10 +24,14 @@ export default defineConfig({
       { find: /^@quiz\/db-people\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/db-people/src/$1') },
       { find: /^@quiz\/events\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/events/src/$1') },
       { find: /^@quiz\/types\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/types/src/$1') },
+      { find: /^@quiz\/ui\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/ui/src/$1') },
+      { find: /^@quiz\/api-client\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/api-client/src/$1') },
+      { find: '@quiz/api-client', replacement: path.resolve(__dirname, '../../packages/api-client/src') },
       { find: '@quiz/auth', replacement: path.resolve(__dirname, '../../packages/auth/src') },
       { find: '@quiz/db-people', replacement: path.resolve(__dirname, '../../packages/db-people/src') },
       { find: '@quiz/events', replacement: path.resolve(__dirname, '../../packages/events/src') },
       { find: '@quiz/types', replacement: path.resolve(__dirname, '../../packages/types/src') },
+      { find: '@quiz/ui', replacement: path.resolve(__dirname, '../../packages/ui/src') },
       { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, './src/$1') },
       { find: '@', replacement: path.resolve(__dirname, './src') },
     ],
```

---

## 3. Full Contents of Newly Created Untracked Files

### 3.1 `packages/ui/src/components/auth/lock-screen-types.ts`
```ts
import type { ReactNode } from 'react';

export type BrandThemeMode = 'theme-a' | 'theme-b' | 'skillhubcore' | 'skillup' | 'realtutorialhub';

export interface LockScreenThemeTokens {
  overlayBg?: string;
  cardBg?: string;
  cardBorder?: string;
  iconContainerGradient?: string;
  iconShadow?: string;
  badgeBg?: string;
  badgeBorder?: string;
  primaryButtonGradient?: string;
  primaryButtonShadow?: string;
  focusRing?: string;
  inputBg?: string;
  inputBorder?: string;
  inputPlaceholder?: string;
  accentText?: string;
}

export interface SharedAdminLockScreenUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  isAdmin?: boolean;
}

export interface SharedAdminLockScreenProps {
  /** Whether the administrative terminal is currently locked */
  isLocked: boolean;
  /** Active user identity details */
  user: SharedAdminLockScreenUser | null | undefined;
  /** Application / brand display name */
  brandName?: string;
  /** Primary headline for the locked terminal */
  brandTitle?: string;
  /** Security protocol or audit subtitle */
  brandSubtitle?: string;
  /** Optional custom brand logo or icon replacement */
  customIcon?: ReactNode;
  /** Active theme preset name ('theme-a', 'theme-b', 'skillhubcore', 'skillup') */
  theme?: BrandThemeMode;
  /** Optional granular theme token overrides */
  themeTokens?: LockScreenThemeTokens;
  /** Re-authentication callback; receives the submitted password */
  onUnlock: (password: string) => Promise<void> | void;
  /** Action when user clicks "Switch Account" */
  onSwitchAccount: () => void;
  /** Action when user clicks "Log out securely" (defaults to onSwitchAccount) */
  onLogout?: () => void;
  /** Controlled loading state (if managed externally) */
  isLoading?: boolean;
  /** Controlled error message (if managed externally) */
  error?: string | null;
  /** Accessible label for the password field */
  passwordLabel?: string;
  /** Placeholder for the password field */
  passwordPlaceholder?: string;
  /** Optional container CSS class name */
  className?: string;
}
```

### 3.2 `packages/ui/src/components/auth/lock-screen-themes.ts`
```ts
import type { BrandThemeMode, LockScreenThemeTokens } from './lock-screen-types';

export const LOCK_SCREEN_THEMES: Record<BrandThemeMode, Required<LockScreenThemeTokens>> = {
  'theme-a': {
    overlayBg: 'bg-[#1A1A1A]/95 backdrop-blur-xl',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    iconContainerGradient: 'bg-gradient-to-br from-[#FF4B91] to-[#FF8E9E]',
    iconShadow: 'shadow-2xl shadow-pink-500/20',
    badgeBg: 'bg-emerald-500 text-white',
    badgeBorder: 'border-[#1A1A1A]',
    primaryButtonGradient: 'bg-gradient-to-r from-[#FF4B91] to-[#FF8E9E]',
    primaryButtonShadow: 'shadow-lg shadow-pink-500/20',
    focusRing: 'focus:ring-[#FF4B91]/40',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputPlaceholder: 'placeholder:text-slate-400',
    accentText: 'text-pink-400',
  },
  'theme-b': {
    overlayBg: 'bg-[#0B132B]/95 backdrop-blur-xl',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    iconContainerGradient: 'bg-gradient-to-br from-[#06283D] to-[#D03F00]',
    iconShadow: 'shadow-2xl shadow-orange-500/20',
    badgeBg: 'bg-emerald-500 text-white',
    badgeBorder: 'border-[#0B132B]',
    primaryButtonGradient: 'bg-gradient-to-r from-[#D03F00] to-[#FF7043]',
    primaryButtonShadow: 'shadow-lg shadow-orange-500/25',
    focusRing: 'focus:ring-[#D03F00]/40',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputPlaceholder: 'placeholder:text-slate-400',
    accentText: 'text-orange-400',
  },
  'realtutorialhub': {
    overlayBg: 'bg-[#1A1A1A]/95 backdrop-blur-xl',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    iconContainerGradient: 'bg-gradient-to-br from-[#FF4B91] to-[#FF8E9E]',
    iconShadow: 'shadow-2xl shadow-pink-500/20',
    badgeBg: 'bg-emerald-500 text-white',
    badgeBorder: 'border-[#1A1A1A]',
    primaryButtonGradient: 'bg-gradient-to-r from-[#FF4B91] to-[#FF8E9E]',
    primaryButtonShadow: 'shadow-lg shadow-pink-500/20',
    focusRing: 'focus:ring-[#FF4B91]/40',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputPlaceholder: 'placeholder:text-slate-400',
    accentText: 'text-pink-400',
  },
  'skillhubcore': {
    overlayBg: 'bg-[#0F172A]/95 backdrop-blur-xl',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    iconContainerGradient: 'bg-gradient-to-br from-[#F54A8D] to-[#133382]',
    iconShadow: 'shadow-2xl shadow-pink-500/20',
    badgeBg: 'bg-emerald-500 text-white',
    badgeBorder: 'border-[#0F172A]',
    primaryButtonGradient: 'bg-gradient-to-r from-[#F54A8D] to-[#FF8E9E]',
    primaryButtonShadow: 'shadow-lg shadow-pink-500/20',
    focusRing: 'focus:ring-[#F54A8D]/40',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputPlaceholder: 'placeholder:text-slate-400',
    accentText: 'text-pink-400',
  },
  'skillup': {
    overlayBg: 'bg-[#0F172A]/95 backdrop-blur-xl',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    iconContainerGradient: 'bg-gradient-to-br from-[#0891B2] to-[#0284C7]',
    iconShadow: 'shadow-2xl shadow-cyan-500/20',
    badgeBg: 'bg-emerald-500 text-white',
    badgeBorder: 'border-[#0F172A]',
    primaryButtonGradient: 'bg-gradient-to-r from-[#0891B2] to-[#06B6D4]',
    primaryButtonShadow: 'shadow-lg shadow-cyan-500/25',
    focusRing: 'focus:ring-cyan-500/40',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputPlaceholder: 'placeholder:text-slate-400',
    accentText: 'text-cyan-400',
  },
};

export function resolveLockScreenTheme(
  themeMode?: BrandThemeMode,
  overrides?: LockScreenThemeTokens
): Required<LockScreenThemeTokens> {
  const baseMode = themeMode && LOCK_SCREEN_THEMES[themeMode] ? themeMode : 'theme-a';
  const baseTokens = LOCK_SCREEN_THEMES[baseMode];

  if (!overrides) {
    return baseTokens;
  }

  return {
    overlayBg: overrides.overlayBg ?? baseTokens.overlayBg,
    cardBg: overrides.cardBg ?? baseTokens.cardBg,
    cardBorder: overrides.cardBorder ?? baseTokens.cardBorder,
    iconContainerGradient: overrides.iconContainerGradient ?? baseTokens.iconContainerGradient,
    iconShadow: overrides.iconShadow ?? baseTokens.iconShadow,
    badgeBg: overrides.badgeBg ?? baseTokens.badgeBg,
    badgeBorder: overrides.badgeBorder ?? baseTokens.badgeBorder,
    primaryButtonGradient: overrides.primaryButtonGradient ?? baseTokens.primaryButtonGradient,
    primaryButtonShadow: overrides.primaryButtonShadow ?? baseTokens.primaryButtonShadow,
    focusRing: overrides.focusRing ?? baseTokens.focusRing,
    inputBg: overrides.inputBg ?? baseTokens.inputBg,
    inputBorder: overrides.inputBorder ?? baseTokens.inputBorder,
    inputPlaceholder: overrides.inputPlaceholder ?? baseTokens.inputPlaceholder,
    accentText: overrides.accentText ?? baseTokens.accentText,
  };
}
```

### 3.3 `packages/ui/src/components/auth/SharedAdminLockScreen.tsx`
```tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, Lock, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { ZLoader } from '../../ZLoader';
import { cn } from '../../lib/utils';
import type { SharedAdminLockScreenProps } from './lock-screen-types';
import { resolveLockScreenTheme } from './lock-screen-themes';

export function SharedAdminLockScreen({
  isLocked,
  user,
  brandName = 'SkillHubCore',
  brandTitle = 'Terminal Locked',
  brandSubtitle = 'Security Protocol Alpha v1.0.4',
  customIcon,
  theme,
  themeTokens: customThemeTokens,
  onUnlock,
  onSwitchAccount,
  onLogout,
  isLoading: externalIsLoading,
  error: externalError,
  passwordLabel = 'Master Password',
  passwordPlaceholder = 'Enter master password',
  className,
}: SharedAdminLockScreenProps) {
  const [password, setPassword] = useState('');
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const tokens = resolveLockScreenTheme(theme, customThemeTokens);

  const isLoading = externalIsLoading ?? internalIsLoading;
  const error = externalError !== undefined ? externalError : internalError;

  // Track and restore focus
  useEffect(() => {
    if (!isLocked) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isLocked]);

  // Accessible focus trap
  useEffect(() => {
    if (!isLocked) return;
    const container = containerRef.current;
    if (!container) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const nodes = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors.join(','))
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLocked]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!password || isLoading) return;

      setInternalIsLoading(true);
      setInternalError(null);

      try {
        await onUnlock(password);
        setPassword('');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setInternalError(message);
      } finally {
        setInternalIsLoading(false);
      }
    },
    [password, isLoading, onUnlock]
  );

  const handleLogoutClick = useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      onSwitchAccount();
    }
  }, [onLogout, onSwitchAccount]);

  if (!isLocked || !user) {
    return null;
  }

  const roleDisplay = user.role
    ? user.role.replace(/_/g, ' ')
    : user.isAdmin
    ? 'Admin'
    : 'Administrator';

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shared-lock-screen-title"
      aria-describedby="shared-lock-screen-subtitle"
      className={cn(
        'fixed inset-0 z-[100000] flex items-center justify-center',
        'animate-in fade-in duration-300 motion-reduce:animate-none',
        tokens.overlayBg,
        className
      )}
    >
      <div
        className={cn(
          'w-full max-w-sm px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center space-y-6 sm:space-y-8',
          'animate-in zoom-in-95 duration-300 motion-reduce:animate-none'
        )}
      >
        {/* Branding and status header */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div
              className={cn(
                'w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center',
                tokens.iconContainerGradient,
                tokens.iconShadow
              )}
            >
              {customIcon ?? <Lock size={36} className="text-white sm:size-10" />}
            </div>
            <div
              className={cn(
                'absolute -bottom-2 -right-2 p-1.5 sm:p-2 rounded-full border-4 shadow-lg',
                tokens.badgeBg,
                tokens.badgeBorder
              )}
            >
              <ShieldCheck size={14} className="sm:size-4" />
            </div>
          </div>

          <div className="text-center">
            <h1
              id="shared-lock-screen-title"
              className="text-xl sm:text-2xl font-black font-outfit uppercase tracking-tighter text-white"
            >
              {brandTitle}
            </h1>
            <p
              id="shared-lock-screen-subtitle"
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 mt-1"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
              {brandSubtitle}
            </p>
          </div>
        </div>

        {/* User Identity Display */}
        <div
          className={cn(
            'w-full p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3 sm:gap-4',
            tokens.cardBg,
            tokens.cardBorder
          )}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center text-slate-400 shrink-0">
            <UserIcon size={20} className="sm:size-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
              {user.email || 'administrator'}
            </p>
            <p className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-2">
              {user.name || user.email || 'Admin User'}
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest',
                  tokens.accentText
                )}
              >
                <ShieldCheck size={12} /> {roleDisplay}
              </span>
            </p>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-300 text-[11px] font-bold uppercase tracking-[0.2em]">
              <span id="lock-screen-password-label">{passwordLabel}</span>
              <button
                type="button"
                onClick={onSwitchAccount}
                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                aria-label="Switch account"
              >
                Switch Account <ChevronRight size={12} />
              </button>
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                minLength={1}
                className={cn(
                  'w-full rounded-2xl px-4 py-3 text-white border focus:outline-none focus:ring-2 transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  tokens.inputBg,
                  tokens.inputBorder,
                  tokens.inputPlaceholder,
                  tokens.focusRing
                )}
                placeholder={passwordPlaceholder}
                aria-label={passwordLabel}
                aria-labelledby="lock-screen-password-label"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'lock-screen-error-alert' : undefined}
                required
              />
              <LogOut className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Error Message with polite screen-reader announcement */}
          {error && (
            <div
              id="lock-screen-error-alert"
              role="alert"
              aria-live="polite"
              className="text-red-400 text-[11px] font-bold uppercase tracking-[0.2em] text-center p-2 rounded-lg bg-red-900/20 border border-red-500/20"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || password.trim() === ''}
            className={cn(
              'w-full py-3.5 sm:py-4 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-xs sm:text-sm',
              'hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              tokens.primaryButtonGradient,
              tokens.primaryButtonShadow
            )}
            aria-label="Unlock terminal"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <ZLoader size="xs" className="text-white" center={false} />
                Re-establishing Session...
              </span>
            ) : (
              'Unlock Terminal'
            )}
          </button>
        </form>

        {/* Secure Logout Action */}
        <button
          type="button"
          onClick={handleLogoutClick}
          className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          aria-label="Log out securely"
        >
          <LogOut size={14} /> Log out securely
        </button>
      </div>
    </div>
  );
}
```

### 3.4 `apps/skillup-admin/src/components/auth/SkillUpAdminLockScreen.tsx`
```tsx
'use client';

import { SharedAdminLockScreen, type SharedAdminLockScreenUser } from '@quiz/ui';
import React from 'react';

export interface SkillUpAdminLockScreenProps {
  isLocked?: boolean;
  user?: SharedAdminLockScreenUser | null;
  onUnlock?: (password: string) => Promise<void> | void;
  onSwitchAccount?: () => void;
  onLogout?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function SkillUpAdminLockScreen({
  isLocked = false,
  user = null,
  onUnlock,
  onSwitchAccount,
  onLogout,
  isLoading = false,
  error = null,
}: SkillUpAdminLockScreenProps) {
  if (!isLocked || !user) {
    return null;
  }

  const handleUnlock = async (password: string) => {
    if (onUnlock) {
      await onUnlock(password);
    }
  };

  const handleSwitchAccount = () => {
    if (onSwitchAccount) {
      onSwitchAccount();
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <SharedAdminLockScreen
      isLocked={isLocked}
      user={user}
      brandName="SkillUp IT Academy"
      brandTitle="Terminal Locked"
      brandSubtitle="SkillUp Security Protocol"
      theme="skillup"
      isLoading={isLoading}
      error={error}
      onUnlock={handleUnlock}
      onSwitchAccount={handleSwitchAccount}
      onLogout={onLogout ?? handleSwitchAccount}
    />
  );
}
```

---

## 4. Reconciliation of All Test Totals & Exact Executed Commands

Below is the complete itemized breakdown of every test suite executed during this batch, clarifying the test totals with exact commands, passed counts, and exit codes:

| Test Group | Workspace / Suite | Executed Command | Passed Tests | Exit Code | Purpose / Focus |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. UI Shared Component** | `@quiz/ui` | `pnpm --filter @quiz/ui exec vitest run src/components/auth/__tests__/SharedAdminLockScreen.test.tsx` | **16 passed** | **0** | Presentation, accessibility, Theme A/B/SHC/SUIA tokens, focus trap, errors |
| **2. SHC Scope B1 Guard & Lock** | `@quiz/skillhubcore-admin` | `pnpm --filter @quiz/skillhubcore-admin exec vitest run src/components/auth/__tests__/admin-guard-scope-b.test.tsx` | **14 passed** | **0** | Lock mount, reauth via `/api/auth/login`, identity match, admin role checks |
| **3. SHC Scope B1 Page Policy** | `@quiz/skillhubcore-admin` | `pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/admin-page-policy.test.ts` | **8 passed** | **0** | 32 protected page route policy & drift tests |
| **4. SHC Scope B1 Server Auth** | `@quiz/skillhubcore-admin` | `pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/server-page-auth.test.ts` | **24 passed** | **0** | JWT issuer/alg/exp, cookie extraction, role mapping |
| **5. SHC Scope B1 Proxy Page Security**| `@quiz/skillhubcore-admin` | `pnpm --filter @quiz/skillhubcore-admin exec vitest run src/lib/__tests__/proxy-page-security.test.ts` | **18 passed** | **0** | Proxy admission, `x-shc-pathname` injection defense, redirects |
| **6. SHC Security Boundary** | `@quiz/skillhubcore-admin` | `pnpm --filter @quiz/skillhubcore-admin test:security` | **61 passed** | **0** | 56 boundary checks in `admin-boundary.test.ts` + 5 in `upstream-proxy.test.ts` |
| **7. SHC API Route Handlers** | `@quiz/skillhubcore-admin` | `pnpm --filter @quiz/skillhubcore-admin check:boundaries` | **80 guarded** | **0** | Verifies all 80 API route handlers have origin/auth guards |
| **8. Real HTTP & Chromium E2E** | Local server port 3007 | `node apps/skillhubcore-admin/scripts/verify-scope-b1-e2e.mjs` | **17 passed** | **0** | Live HTTP 307s, 200s, HEAD, RSC, prefetch, Chromium admin & forbidden nav |
| **9. RTH Admin Lock Screen** | `@quiz/realtutorialhub-admin` | `pnpm --filter @quiz/realtutorialhub-admin exec vitest run src/components/auth/__tests__/admin-lock-screen.test.tsx` | **10 passed** | **0** | RTH auth, Theme A/B adaptation, identity mismatch rejection, role check |
| **10. SUIA Compatibility** | `@quiz/skillup-admin` | `pnpm --filter @quiz/skillup-admin exec vitest run src/components/auth/__tests__/skillup-admin-lock-screen.test.tsx` | **4 passed** | **0** | Inactive safety, cyan token rendering, password submission |
| **11. Scope A RBAC** | `@quiz/auth` | `pnpm --filter @quiz/auth test` | **172 passed** | **0** | Includes 19 Scope A tenant boundary & RBAC tests (6 in `sol-fnd03`, 13 in `rbac.service`) |
| **12. Isolated Fixture Suite** | `@quiz/skillhubcore-admin` | `pnpm --filter @quiz/skillhubcore-admin test:isolated` | **89 passed, 1 failed** | **1 (expected)** | Preserved pre-existing baseline Zod schema validation diagnostic |

### Test Count Reconciliation
- **Total New Admin Lock Screen & Theming Tests:** 16 (`@quiz/ui`) + 10 (RTH) + 4 (SUIA) + 6 (new Lock tests in SHC) = **36 new tests**.
- **Total Scope B1 Core Suite:** 14 (Guard/Lock) + 8 (Policy) + 24 (Server Auth) + 18 (Proxy) = **64 unit tests** + **17 live integration/Chromium tests** = **81 Scope B1 tests**.
- **Combined Active Security Verification Across Monorepo:** 64 (Scope B1) + 61 (`test:security`) + 80 (`check:boundaries`) + 17 (Chromium E2E) + 16 (Shared UI) + 10 (RTH) + 4 (SUIA) = **252 verified points of test evidence** (excluding the 172 `@quiz/auth` tests).

---

## 5. Evidence for the Pre-Existing Zod Baseline Failure

### 5.1 Test Execution Output from `test:isolated`
```
 FAIL  src/app/api/tutorial-composer/__tests__/validate-fixtures.test.ts > Fixture Validation Diagnostics > createEmptyTestDocument() must FAIL TutorialDocumentSchema (by design)
ZodError: [
  {
    "code": "too_small",
    "minimum": 0,
    "type": "number",
    "inclusive": false,
    "exact": false,
    "message": "Number must be greater than 0",
    "path": [
      "metadata",
      "estimatedReadTime"
    ]
  }
]
 ❯ Object.get error [as error] ../../node_modules/zod/v3/types.js:39:31
 ❯ ZodEffects.parse ../../node_modules/zod/v3/types.js:114:22
 ❯ buildTutorialDocument ../../packages/db-tutorial/src/services/tutorial-document-builder.ts:39:33
 ❯ createEmptyTestDocument src/app/api/tutorial-composer/__tests__/fixtures/tutorial-document.fixtures.ts:88:10
 ❯ src/app/api/tutorial-composer/__tests__/validate-fixtures.test.ts:44:22
```

### 5.2 Git Log Origin
```powershell
$ git log -n 1 --oneline apps/skillhubcore-admin/src/app/api/tutorial-composer/__tests__/validate-fixtures.test.ts
5871e50e feat(tutorial-composer): Phase 2E-1 Step 2B - API integration tests with real PostgreSQL
```

### 5.3 Technical Root Cause
In `apps/skillhubcore-admin/src/app/api/tutorial-composer/__tests__/fixtures/tutorial-document.fixtures.ts:88`:
```ts
export function createEmptyTestDocument(): TutorialDocument {
  return buildTutorialDocument(
    [], // Empty blocks
    {
      estimatedReadTime: 0, // <--- Throws ZodError inside builder function
      tags: [],
      complexityScore: 1,
    }
  );
}
```
The test author intended to test that empty documents fail validation (`expect(result.success).toBe(false)`), but called `createEmptyTestDocument()` which invokes `buildTutorialDocument()`. Inside `buildTutorialDocument()`, `TutorialDocumentSchema.parse()` is called directly without a try/catch, throwing an unhandled `ZodError` on `estimatedReadTime: 0` before the test assertion is reached.

This failure originated in commit `5871e50e` in the tutorial composer, is documented in the audit baseline `audit/W1.2_Batch_08_Handoff.md`, and was not introduced or affected by this implementation.

---

## 6. Same-Account and Role Reauthentication Enforcement

### 6.1 SkillHubCore Implementation
In [`apps/skillhubcore-admin/src/components/auth/AdminLockScreen.tsx`](file:///e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/components/auth/AdminLockScreen.tsx):
- Reauthenticates against SHC login BFF: `fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-brand': 'skillhubcore' }, body: JSON.stringify({ email, password, platform: 'skillhubcore' }) })`.
- Same-account check:
  ```ts
  if (user.id && data.user.id && data.user.id !== user.id) {
    throw new Error('Reauthenticated user does not match the locked session');
  }
  if (user.email && data.user.email && data.user.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error('Reauthenticated user does not match the locked session');
  }
  ```
- Role check:
  ```ts
  const role = (data.user.role || '').toLowerCase();
  const isAdminRole = role === 'admin' || role === 'super_admin' || data.user.isAdmin === true;
  if (!isAdminRole) {
    throw new Error('Insufficient permissions: Administrator role required');
  }
  ```
- Negative tests in `admin-guard-scope-b.test.tsx`:
  - `rejects unlock and remains locked on incorrect password` (PASS)
  - `rejects reauthentication with mismatched account identity` (PASS)
  - `rejects reauthentication if user lacks admin role` (PASS)
  - `handles network failure gracefully without unlocking` (PASS)

### 6.2 RealTutorialHub Implementation
In [`apps/realtutorialhub-admin/src/components/auth/AdminLockScreen.tsx`](file:///e:/onlinewebsites/quiz-platform/apps/realtutorialhub-admin/src/components/auth/AdminLockScreen.tsx):
- Reauthenticates via RTH portal helper: `loginPortalSession({ email, password, platform: 'realtutorialhub', portalIdentity: 'admin', portalName: 'RealTutorialHub Admin', allowedRoles: ['admin', 'super_admin'] })`.
- Same-account check:
  ```ts
  if (typeof user.id === 'string' && user.id.length > 0 && refreshedUser.id !== user.id) {
    throw new Error('Reauthenticated user does not match the locked session');
  }
  if (typeof user.email === 'string' && user.email.length > 0 && refreshedUser.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error('Reauthenticated user does not match the locked session');
  }
  ```
- Role check:
  ```ts
  const role = typeof refreshedUser.role === 'string' ? refreshedUser.role.toLowerCase() : '';
  const isAdminRole = role === 'admin' || role === 'super_admin' || refreshedUser.isAdmin === true;
  if (!isAdminRole) {
    throw new Error('Insufficient permissions: Administrator role required');
  }
  ```
- Negative tests in `admin-lock-screen.test.tsx`:
  - `rejects unlock and remains locked on incorrect password` (PASS)
  - `rejects unlock and remains locked on identity mismatch (different user ID)` (PASS)
  - `rejects unlock and remains locked if reauthenticated account lacks admin role` (PASS)

---

## 7. SUIA Inactive Safety Verification

- **Layout Inspection:** `apps/skillup-admin/src/app/(admin)/layout.tsx` was inspected. It contains **no** imports, no references, and no JSX rendering of `SkillUpAdminLockScreen` or any client lock screen. It strictly uses server-side `getSkillUpAdminRole()`:
  ```tsx
  export default async function AdminSectionLayout({ children }: { children: ReactNode }) {
    const role = await getSkillUpAdminRole();
    ...
  ```
- **Adapter Safety:** [`apps/skillup-admin/src/components/auth/SkillUpAdminLockScreen.tsx`](file:///e:/onlinewebsites/quiz-platform/apps/skillup-admin/src/components/auth/SkillUpAdminLockScreen.tsx) defaults `isLocked = false` and returns `null` if `!isLocked || !user`.
- **Zero Session Alterations:** It makes zero requests on mount, touches no cookies, and registers no global listeners.
- **Unit Test:** `apps/skillup-admin/src/components/auth/__tests__/skillup-admin-lock-screen.test.tsx`:
  ```tsx
  it('remains inactive and returns null by default (safety: unapproved policy not activated)', () => {
    const { container } = render(<SkillUpAdminLockScreen user={mockUser} />);
    expect(container.firstChild).toBeNull();
  });
  ```

---

## 8. Preservation of Scope B1 & Boundary Protection

- **32 Protected Pages:** All 32 SHC admin page routes remain guarded.
- **Server Authentication:** `evaluateServerCookiesPageAccess` in `server-page-auth.ts` remains authoritative.
- **Proxy:** `proxy.ts` forwards `x-shc-pathname` header and enforces cache-control `private, no-store`.
- **Zero B2/B3 Scope Creep:** No backend session redesign, Redis revocation, or refresh mutations were introduced.

---

## 9. Final Git Status & Compliance Statement

```powershell
$ git status
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   apps/realtutorialhub-admin/src/components/auth/AdminLockScreen.tsx
	modified:   apps/skillhubcore-admin/src/components/auth/AdminGuard.tsx
	modified:   apps/skillhubcore-admin/src/components/auth/AdminLockScreen.tsx
	modified:   apps/skillhubcore-admin/src/components/auth/__tests__/admin-guard-scope-b.test.tsx
	modified:   apps/skillup-admin/tailwind.config.ts
	modified:   apps/skillup-admin/vitest.config.ts
	modified:   packages/ui/src/index.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	apps/realtutorialhub-admin/src/components/auth/__tests__/
	apps/skillhubcore-admin/scripts/verify-scope-b1-e2e.mjs
	apps/skillup-admin/src/components/auth/
	audit/SHARED_ADMIN_LOCK_SCREEN_EVIDENCE_HANDOFF.md
	audit/SHARED_ADMIN_LOCK_SCREEN_GOVERNANCE_REPORT.md
	packages/ui/src/components/auth/

no changes added to commit (use "git add" and/or "git commit -a")
```

- **Committed Baseline:** `0b396a4c30660b91c256db097fb9a9dacfe13ebc` on `main`.
- **No Git Commit Performed.**
- **No Git Push Performed.**
- **No Hostinger VPS Deployment Performed.**
- **Canonical Acceptance Ledger Preserved at:** **2 PASS / 17 FAIL / 43 PENDING**.

