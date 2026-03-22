import Link from 'next/link';

import { TotpActionModal } from '@/components/totp-action-modal';
import { adminUsers, formatDateTime } from '@/lib/skillhubcore-admin-data';

export default function UsersPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Users</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Identity and platform access</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Search users, inspect platform access, and apply sensitive actions behind a TOTP re-auth modal.
        </p>
      </article>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700">
            Search users
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
              placeholder="Name or email"
            />
          </label>

          <div className="mt-6 space-y-3">
            {adminUsers.map((user) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                className="block rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">{user.role}</p>
                  </div>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                    {user.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">User detail</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Open a user profile from the list</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The detail screen includes role, platform access, subscription history, and sensitive actions.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Created at</p>
              <p className="mt-1 text-sm text-slate-600">{formatDateTime(adminUsers[0].createdAt)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Sensitive actions</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <TotpActionModal
                  triggerLabel="Suspend user"
                  title="Suspend selected user"
                  description="Confirm this action with a TOTP code before the user is suspended."
                  endpoint="/api/admin/users/user-4/suspend"
                  body={{ reason: 'manual_review' }}
                  danger
                />
                <TotpActionModal
                  triggerLabel="Change role"
                  title="Change user role"
                  description="TOTP verification is required before updating the role."
                  endpoint="/api/admin/users/user-4/role"
                  body={{ role: 'admin' }}
                />
              </div>
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
