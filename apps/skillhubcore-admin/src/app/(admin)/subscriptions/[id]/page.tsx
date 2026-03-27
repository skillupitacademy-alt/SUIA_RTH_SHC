import Link from 'next/link';
import { notFound } from 'next/navigation';

import { TotpActionModal } from '@/components/totp-action-modal';
import { adminAuditLogs, findAdminSubscription, findAdminUser, formatCurrency, formatDateTime } from '@/lib/skillhubcore-admin-data';

type SubscriptionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  const { id } = await params;
  const subscription = findAdminSubscription(id);

  if (subscription === undefined) {
    notFound();
  }

  const user = findAdminUser(subscription.userId);
  const auditTrail = adminAuditLogs.filter((entry) => entry.action.includes('subscription.') || entry.actor === subscription.userName);
  const monthlyValue = subscription.plan === 'combo' ? 4999 : subscription.plan === 'premium' ? 2999 : subscription.plan === 'training' ? 2499 : 999;

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-8 shadow-sm backdrop-blur-[16px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Subscription detail</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight font-outfit text-slate-950">{subscription.userName}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {subscription.plan} on {subscription.platform} started {formatDateTime(subscription.startedAt)}.
            </p>
          </div>
          <Link href="/subscriptions" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
            Back to subscriptions
          </Link>
        </div>
      </article>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-[16px]">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Billing profile</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              { label: 'Status', value: subscription.status },
              { label: 'Platform', value: subscription.platform },
              { label: 'Started', value: formatDateTime(subscription.startedAt) },
              { label: 'Expires', value: formatDateTime(subscription.expiresAt) },
              { label: 'Monthly value', value: formatCurrency(monthlyValue) },
              { label: 'Plan', value: subscription.plan },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Entitled features</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {subscription.features.map((feature) => (
                <span key={feature} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Linked account</p>
            <p className="mt-2 text-sm text-slate-600">
              {user !== undefined ? (
                <>
                  {user.name} ({user.role}) - {user.email}
                </>
              ) : (
                'No linked admin user was found in the mock data set.'
              )}
            </p>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-[16px]">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Actions</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <TotpActionModal
              triggerLabel="Upgrade plan"
              title="Upgrade subscription"
              description="TOTP re-auth is required before changing the subscription tier."
              endpoint={`/api/admin/subscriptions/${subscription.id}`}
              body={{ plan: subscription.plan === 'free' ? 'premium' : 'combo' }}
            />
            <TotpActionModal
              triggerLabel="Cancel subscription"
              title="Cancel subscription"
              description="TOTP re-auth is required before cancelling this subscription."
              endpoint={`/api/admin/subscriptions/${subscription.id}`}
              body={{ status: 'cancelled' }}
              danger
            />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Recent audit trail</p>
            <div className="mt-3 space-y-3">
              {auditTrail.slice(0, 3).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">{entry.action}</p>
                  <p className="mt-1 text-sm text-slate-600">{entry.details}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">{formatDateTime(entry.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
