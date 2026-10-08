import { PortalLoginPage } from '@quiz/ui';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-6 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200/70 bg-white/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-[20px]">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-8 w-48 animate-pulse rounded bg-slate-200/80" />
              <div className="h-4 w-72 animate-pulse rounded bg-slate-200/70" />
              <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200/70" />
              <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200/70" />
              <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200/70" />
            </div>
          }
        >
          <PortalLoginPage
            title="Welcome Back"
            description="Authenticate to access the governance terminal."
            portalIdentity="admin"
            platform="realtutorialhub"
            allowedRoles={['admin', 'super_admin']}
            portalName="RealTutorialHub Admin"
            footerTitle="Restricted Access System v1.0.4"
            footerSubtitle="Unauthorized access attempts are logged and reported."
          />
        </Suspense>
      </div>
    </div>
  );
}
