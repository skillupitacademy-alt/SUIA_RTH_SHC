'use client';

import Link from 'next/link';
import { Award, BadgeCheck, BookOpen, CalendarDays, GraduationCap, LayoutDashboard, Sparkles, UserCircle2 } from 'lucide-react';
import { useMemo } from 'react';

import { useDashboardQuery } from '@/hooks/queries/dashboard.queries';
import { useUserProfile } from '@/hooks/queries/useUserProfile';

const fallbackSkillTags = ['Quiz readiness', 'Adaptive learning', 'Profile complete'];

function formatScore(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0%';
  }

  return `${Math.round(value)}%`;
}

export default function ProfilePage() {
  const { data: session, isLoading: sessionLoading } = useUserProfile();
  const { data: dashboard, isLoading: dashboardLoading } = useDashboardQuery('28d', 1, 5);
  const isLoading = sessionLoading || dashboardLoading;

  const skillTags = useMemo(() => {
    const tags = new Set<string>(fallbackSkillTags);
    const profile = session?.user;

    if (profile?.professionalStatus) tags.add(profile.professionalStatus);
    if (profile?.educationLevel) tags.add(profile.educationLevel);
    for (const domain of profile?.domainInterest ?? []) {
      if (typeof domain === 'string' && domain.trim().length > 0) {
        tags.add(domain.replace(/-/g, ' '));
      }
    }

    return Array.from(tags).slice(0, 6);
  }, [session?.user]);

  const overview = dashboard?.overview;
  const recentActivity = dashboard?.recentActivity ?? [];

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="surface-panel rounded-[3rem] p-8 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="section-kicker text-cyan-600">Profile</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">Your learning identity at a glance</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Review your session profile, exam history summary, and skill tags without leaving the student portal.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <Link href="/dashboard/settings" className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600">
              <BadgeCheck size={16} />
              Settings
            </Link>
          </div>
        </div>
      </article>

      {isLoading ? (
        <article className="surface-panel rounded-[2.25rem] p-6 lg:p-8 text-sm text-slate-600">
          Loading profile summary...
        </article>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="surface-panel rounded-[2.25rem] p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-cyan-500/10 text-cyan-600">
              <UserCircle2 size={36} />
            </div>
            <div className="min-w-0">
              <p className="section-kicker text-slate-500">Signed in as</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{session?.user?.name ?? 'Student'}</h2>
              <p className="mt-1 text-sm text-slate-600 break-all">{session?.user?.email ?? 'student@example.com'}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Avg score</p>
              <p className="mt-3 text-3xl font-black text-slate-950">{formatScore(overview?.avgScore)}</p>
              <p className="mt-2 text-sm text-slate-600">Across your recent exam history</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Exams taken</p>
              <p className="mt-3 text-3xl font-black text-slate-950">{overview?.totalExams ?? 0}</p>
              <p className="mt-2 text-sm text-slate-600">Completed quiz attempts</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Mastery points</p>
              <p className="mt-3 text-3xl font-black text-slate-950">{overview?.masteryPoints ?? 0}</p>
              <p className="mt-2 text-sm text-slate-600">Consistency and progress total</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Global rank</p>
              <p className="mt-3 text-3xl font-black text-slate-950">{overview?.globalRank ?? 'Pending'}</p>
              <p className="mt-2 text-sm text-slate-600">Unlocked after a few more attempts</p>
            </div>
          </div>
        </article>

        <aside className="surface-panel rounded-[2.25rem] p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="section-kicker text-slate-500">Skill tags</p>
              <h3 className="text-xl font-black tracking-tight text-slate-950">Your current focus areas</h3>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {skillTags.map((tag) => (
              <span key={tag} className="rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Learning streak</p>
            <div className="mt-3 flex items-end gap-3">
              <p className="text-4xl font-black text-slate-950">{overview?.weeklyExamsCount ?? 0}</p>
              <p className="pb-1 text-sm text-slate-600">exams this week</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">Keep the streak active to maintain your adaptive path.</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="surface-panel rounded-[2.25rem] p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="section-kicker text-slate-500">Exam history</p>
              <h3 className="text-xl font-black tracking-tight text-slate-950">Recent activity summary</h3>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.relativeTime}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-950">{item.score ?? 'Pending'}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-500">{item.status}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No exam history is available yet. Start a quiz from the dashboard to populate this summary.
              </div>
            )}
          </div>
        </article>

        <aside className="surface-panel rounded-[2.25rem] p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="section-kicker text-slate-500">Next actions</p>
              <h3 className="text-xl font-black tracking-tight text-slate-950">Keep moving</h3>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Link href="/dashboard" className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
              <span>Return to dashboard</span>
              <LayoutDashboard size={16} />
            </Link>
            <Link href="/dashboard/my-exams" className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
              <span>Review exam history</span>
              <Award size={16} />
            </Link>
            <Link href="/dashboard/settings" className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
              <span>Update account preferences</span>
              <GraduationCap size={16} />
            </Link>
          </div>

          <div className="mt-8 rounded-[1.5rem] bg-cyan-500/5 p-5 text-sm text-cyan-900">
            The profile page stays read-only and reuses the existing quiz session and dashboard APIs. No new auth flow was added.
          </div>
        </aside>
      </section>
    </section>
  );
}
