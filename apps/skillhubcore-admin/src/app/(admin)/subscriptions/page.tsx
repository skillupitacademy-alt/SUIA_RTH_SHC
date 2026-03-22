import { TotpActionModal } from '@/components/totp-action-modal';
import { adminSubscriptions, formatDateTime } from '@/lib/skillhubcore-admin-data';

export default function SubscriptionsPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Subscriptions</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Plan management</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Review current plans, change tiers, and cancel subscriptions with a TOTP confirmation step on sensitive actions.
        </p>
      </article>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {adminSubscriptions.map((subscription) => (
              <div key={subscription.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{subscription.userName}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {subscription.plan} - {subscription.platform}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-500">
                      {formatDateTime(subscription.expiresAt)}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                    {subscription.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <TotpActionModal
                    triggerLabel="Upgrade / downgrade"
                    title="Change subscription plan"
                    description="TOTP verification is required before changing the user's plan."
                    endpoint={`/api/admin/subscriptions/${subscription.id}`}
                    body={{ plan: subscription.plan === 'free' ? 'premium' : 'combo' }}
                  />
                  <TotpActionModal
                    triggerLabel="Cancel"
                    title="Cancel subscription"
                    description="TOTP verification is required before canceling the subscription."
                    endpoint={`/api/admin/subscriptions/${subscription.id}`}
                    body={{ status: 'cancelled' }}
                    danger
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Filters</p>
          <div className="mt-6 grid gap-3">
            <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300" placeholder="Plan" />
            <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300" placeholder="Status" />
            <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300" placeholder="Platform" />
          </div>
        </aside>
      </section>
    </section>
  );
}
