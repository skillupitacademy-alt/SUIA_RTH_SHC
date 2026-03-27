import Link from 'next/link';
import { notFound } from 'next/navigation';

import { TotpActionModal } from '@/components/totp-action-modal';
import { adminAuditLogs, adminSubscriptions, findAdminUser, formatDateTime } from '@/lib/skillhubcore-admin-data';

type UserDetailPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;
  const user = findAdminUser(userId);

  if (user === undefined) {
    notFound();
  }

  const subscriptionHistory = adminSubscriptions.filter((item) => item.userId === user.id);
  const auditEntries = adminAuditLogs.filter((entry) => entry.actor === user.name || entry.action.includes('user.'));

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-8 shadow-sm backdrop-blur-[16px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">User detail</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight font-outfit text-slate-950">{user.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{user.email}</p>
          </div>
          <Link href="/users" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
            Back to users
          </Link>
        </div>
      </article>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Profile</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              { label: 'Role', value: user.role },
              { label: 'Status', value: user.status },
              { label: 'Created', value: formatDateTime(user.createdAt) },
              { label: 'Last active', value: formatDateTime(user.lastActiveAt) },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Platform access</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {user.platforms.map((platform) => (
                <span key={platform} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Sensitive actions</p>
          <div className="mt-6 space-y-3">
            <TotpActionModal
              triggerLabel="Suspend user"
              title="Suspend user"
              description="Enter a TOTP code to suspend this account."
              endpoint={`/api/admin/users/${user.id}/suspend`}
              body={{ reason: 'manual_review' }}
              danger
            />
            <TotpActionModal
              triggerLabel="Change role"
              title="Change role"
              description="Enter a TOTP code before updating the user role."
              endpoint={`/api/admin/users/${user.id}/role`}
              body={{ role: user.role === 'student' ? 'admin' : 'super_admin' }}
            />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Subscription history</p>
            <div className="mt-3 space-y-3">
              {subscriptionHistory.map((subscription) => (
                <div key={subscription.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">{subscription.plan}</p>
                  <p className="mt-1 text-sm text-slate-600">{subscription.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Audit trail</p>
            <div className="mt-3 space-y-3">
              {auditEntries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">{entry.action}</p>
                  <p className="mt-1 text-sm text-slate-600">{entry.details}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
