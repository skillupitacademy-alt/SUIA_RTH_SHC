import React from 'react';
import { CheckCircle2, Circle, ClipboardCheck, Lock, Route, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

type SectionKey =
  | 'overview'
  | 'notes'
  | 'layman'
  | 'real_life'
  | 'technical'
  | 'code'
  | 'visual'
  | 'practice'
  | 'assignment'
  | 'project'
  | 'quiz'
  | 'summary'
  | 'interview'
  | 'ai_tutor';

type ProgressMilestone = {
  tabId: string;
  sectionKey: SectionKey;
  label: string;
  focus: string;
  evidence: string;
  xp: number;
};

const milestones: ProgressMilestone[] = [
  {
    tabId: 'overview',
    sectionKey: 'overview',
    label: 'Orientation',
    focus: 'Understand what Python lists are and where they fit in the course.',
    evidence: 'You can explain the topic goal, learning path, and expected outcome before starting details.',
    xp: 20,
  },
  {
    tabId: 'notes',
    sectionKey: 'notes',
    label: 'Core Notes',
    focus: 'Build the base definition, syntax memory, cheat sheet, and common operations.',
    evidence: 'You can define a list, identify list syntax, and recall the most used list operations.',
    xp: 50,
  },
  {
    tabId: 'layman',
    sectionKey: 'layman',
    label: 'Simple Explanation',
    focus: 'Translate the concept into plain language using everyday reasoning.',
    evidence: 'You can explain a list to a beginner using a shopping basket or container analogy.',
    xp: 40,
  },
  {
    tabId: 'real-life',
    sectionKey: 'real_life',
    label: 'Real-Life Transfer',
    focus: 'Connect lists with production-style examples like carts, playlists, queues, and dashboards.',
    evidence: 'You can choose lists for ordered groups of values and describe why order matters.',
    xp: 60,
  },
  {
    tabId: 'technical-deep-dive',
    sectionKey: 'technical',
    label: 'Technical Depth',
    focus: 'Learn list mutability, indexing, slicing, iteration, complexity, and memory behavior.',
    evidence: 'You can reason about list updates, nested structures, copies, and operation cost.',
    xp: 90,
  },
  {
    tabId: 'code-example',
    sectionKey: 'code',
    label: 'Code Walkthrough',
    focus: 'Read, run, debug, and extend practical Python list code.',
    evidence: 'You can write list examples with clear variable names, comments, validation, and output checks.',
    xp: 80,
  },
  {
    tabId: 'visual-explanation',
    sectionKey: 'visual',
    label: 'Visual Model',
    focus: 'Use diagrams to understand indexes, operations, flow, memory, and transformations.',
    evidence: 'You can mentally picture how values move when a list is appended, sliced, sorted, or filtered.',
    xp: 70,
  },
  {
    tabId: 'practice-test',
    sectionKey: 'practice',
    label: 'Practice Test',
    focus: 'Solve targeted questions across syntax, behavior, edge cases, and debugging.',
    evidence: 'You can answer mixed easy, medium, and hard checks without depending on memorized examples.',
    xp: 120,
  },
  {
    tabId: 'assignments',
    sectionKey: 'assignment',
    label: 'Assignment',
    focus: 'Implement a structured list-processing task with requirements, validation, and test thinking.',
    evidence: 'You can deliver code that handles input, transformations, edge cases, and expected outputs.',
    xp: 300,
  },
  {
    tabId: 'project',
    sectionKey: 'project',
    label: 'Projects',
    focus: 'Build portfolio-grade projects where lists are central to product behavior.',
    evidence: 'You can turn list knowledge into a working feature, system, or small product workflow.',
    xp: 500,
  },
  {
    tabId: 'quiz',
    sectionKey: 'quiz',
    label: 'Quiz',
    focus: 'Validate readiness using timed, varied, and concept-heavy questions.',
    evidence: 'You can score strongly across fundamentals, technical detail, and scenario questions.',
    xp: 400,
  },
  {
    tabId: 'summary',
    sectionKey: 'summary',
    label: 'Summary',
    focus: 'Consolidate the topic into takeaways, checklist, mistakes, and revision direction.',
    evidence: 'You can revise the whole topic quickly and identify what to practice next.',
    xp: 60,
  },
  {
    tabId: 'interview',
    sectionKey: 'interview',
    label: 'Interview Prep',
    focus: 'Prepare FAANG-level explanations, tradeoffs, and follow-up answers.',
    evidence: 'You can answer list questions with examples, complexity, edge cases, and clean reasoning.',
    xp: 180,
  },
  {
    tabId: 'ai-tutor',
    sectionKey: 'ai_tutor',
    label: 'Live Mentor',
    focus: 'Ask doubts, get guided hints, and correct misconceptions step by step.',
    evidence: 'You can ask precise questions and use hints to solve instead of passively reading answers.',
    xp: 100,
  },
];

function hasValidSection(data: SubtopicNotesViewData, key: SectionKey): boolean {
  if (key === 'overview') {
    return true;
  }
  return Boolean(data.sectionRecordIds?.[key] && !data.sectionErrors?.[key]);
}

function statusFor(data: SubtopicNotesViewData, key: SectionKey): 'ready' | 'blocked' | 'pending' {
  if (key === 'overview') {
    return 'ready';
  }
  if (data.sectionErrors?.[key]) {
    return 'blocked';
  }
  return data.sectionRecordIds?.[key] ? 'ready' : 'pending';
}

function StatusBadge({ status }: { status: 'ready' | 'blocked' | 'pending' }) {
  const styles = {
    ready: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    blocked: 'border-red-200 bg-red-50 text-red-800',
    pending: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

export function ProgressContent({ notesData, onSelectTab }: { notesData: SubtopicNotesViewData; onSelectTab: (id: string) => void }) {
  const brand = useBrand();
  const readyMilestones = milestones.filter((milestone) => hasValidSection(notesData, milestone.sectionKey));
  const blockedMilestones = milestones.filter((milestone) => statusFor(notesData, milestone.sectionKey) === 'blocked');
  const pendingMilestones = milestones.filter((milestone) => statusFor(notesData, milestone.sectionKey) === 'pending');
  const contentReadinessPercent = Math.round((readyMilestones.length / milestones.length) * 100);
  const totalXp = milestones.reduce((sum, milestone) => sum + milestone.xp, 0);
  const readyXp = readyMilestones.reduce((sum, milestone) => sum + milestone.xp, 0);
  const nextMilestone = milestones.find((milestone) => statusFor(notesData, milestone.sectionKey) !== 'ready') ?? milestones[0];

  const statCards = [
    {
      label: 'Learner progress',
      value: notesData.leftSidebar.progress.message,
      detail: 'Updates as section completion tracking is connected for the signed-in learner.',
      icon: TrendingUp,
    },
    {
      label: 'Content readiness',
      value: `${contentReadinessPercent}%`,
      detail: `${readyMilestones.length} of ${milestones.length} learning sections are available and schema-valid.`,
      icon: ClipboardCheck,
    },
    {
      label: 'XP available',
      value: `${readyXp}/${totalXp}`,
      detail: 'Estimated XP represented by the currently available learning, test, assignment, and project sections.',
      icon: Sparkles,
    },
    {
      label: 'Next focus',
      value: nextMilestone.label,
      detail: nextMilestone.focus,
      icon: Target,
    },
  ];

  return (
    <section className="min-w-0 space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl sm:p-8 lg:p-10">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider text-white" style={{ backgroundColor: brand.primaryColor }}>
              <Route size={16} aria-hidden="true" />
              Progress Dashboard
            </div>
            <h1 className="mt-5 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Python List Mastery Progress
            </h1>
            <p className="mt-4 max-w-4xl break-words text-base font-medium leading-7 text-slate-700">
              Use this page to track readiness across every part of the Python Lists learning journey: concept clarity,
              visual understanding, implementation, practice, assignments, projects, quiz readiness, interview prep, and
              mentor support. It separates learner completion from content availability so the page remains honest and useful.
            </p>
          </div>
          <div className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:w-80">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">Readiness</span>
              <span className="text-2xl font-black text-slate-950">{contentReadinessPercent}%</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
              <div className="h-full rounded-full" style={{ width: `${contentReadinessPercent}%`, backgroundColor: brand.primaryColor }} />
            </div>
            <p className="mt-4 text-sm font-bold leading-6 text-slate-700">
              {blockedMilestones.length === 0 && pendingMilestones.length === 0
                ? 'All learning content sections are present and ready to study.'
                : `${blockedMilestones.length} blocked and ${pendingMilestones.length} pending sections still need attention.`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">{card.label}</p>
                  <p className="mt-1 break-words text-xl font-black text-slate-950">{card.value}</p>
                  <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-700">{card.detail}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg sm:p-7">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="break-words text-2xl font-black text-slate-950">Section-by-Section Mastery Path</h2>
              <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-700">
                Each milestone explains what the learner should understand before moving forward.
              </p>
            </div>
            <span className="text-sm font-black text-slate-700">{readyMilestones.length}/{milestones.length} ready</span>
          </div>

          <div className="mt-6 space-y-4">
            {milestones.map((milestone, index) => {
              const status = statusFor(notesData, milestone.sectionKey);
              const Icon = status === 'ready' ? CheckCircle2 : status === 'blocked' ? Lock : Circle;
              return (
                <article key={milestone.sectionKey} className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: status === 'ready' ? brand.primaryColor : '#64748b' }}>
                        <Icon size={20} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <h3 className="break-words text-lg font-black text-slate-950">{milestone.label}</h3>
                        </div>
                        <p className="mt-3 break-words text-sm font-bold leading-6 text-slate-800">{milestone.focus}</p>
                        <p className="mt-2 break-words text-sm leading-6 text-slate-700">{milestone.evidence}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-800 ring-1 ring-slate-200">
                        {milestone.xp} XP
                      </span>
                      <StatusBadge status={status} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTab(milestone.tabId)}
                    className="mt-4 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:opacity-90"
                    style={{ backgroundColor: brand.primaryColorDark || brand.primaryColor }}
                  >
                    Open {milestone.label}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="min-w-0 space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-xl font-black text-slate-950">Mastery Gates</h2>
            <div className="mt-5 space-y-4">
              {[
                ['Foundation Gate', 'Finish notes, layman, real-life, visual, technical, and code sections.'],
                ['Practice Gate', 'Complete practice tests and review every incorrect answer pattern.'],
                ['Builder Gate', 'Complete assignment and project work with edge-case handling.'],
                ['Interview Gate', 'Attempt quiz and interview prep with clear complexity explanations.'],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-black text-slate-950">{title}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-xl font-black text-slate-950">Recommended Next Actions</h2>
            <ol className="mt-5 space-y-3">
              {[
                'Read the notes once without coding, then again while typing the examples.',
                'Use the visual explanation to memorize index positions and list transformation flow.',
                'Attempt practice questions before opening the quiz so weak areas are visible early.',
                'Build at least one assignment and one project without copying the reference structure.',
                'Use Live Mentor only after writing your own first answer or code attempt.',
              ].map((item, index) => (
                <li key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-800">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: brand.primaryColor }}>
                    {index + 1}
                  </span>
                  <span className="min-w-0 break-words">{item}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </section>
  );
}
