import React from 'react';
import Link from 'next/link';
import {
  Plus,
  FileEdit,
  Trash2,
  ArrowUpDown,
  Copy,
  Eye,
  Code2,
  ArrowRight,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: 'Tutorial Block Composer | SkillHubCore Admin',
  description: 'Master navigation console for tutorial block CRUD operations and composition.',
};

interface OperationCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  badge: string;
  badgeColor: string;
  buttonColor: string;
}

const OPERATION_CARDS: OperationCard[] = [
  {
    id: 'create-block',
    title: 'Create Block',
    description: 'Add a new block instance to a tutorial document.',
    href: '/tools/tutorial-page-content',
    icon: Plus,
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-500/25',
    badge: 'CREATE / APPEND',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
    buttonColor: 'bg-[#e11d48] hover:bg-[#be123c] text-white',
  },
  {
    id: 'update-block',
    title: 'Update Block',
    description: 'Edit one existing block instance without affecting other blocks.',
    href: '/tools/tutorial-page-content/update',
    icon: FileEdit,
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-500/25',
    badge: 'MUTATE INSTANCE',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    buttonColor: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
  {
    id: 'delete-block',
    title: 'Delete Block',
    description: 'Remove one block safely from the tutorial document.',
    href: '/tools/tutorial-page-content/delete',
    icon: Trash2,
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25',
    badge: 'SAFE REMOVAL',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    buttonColor: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  {
    id: 'reorder-blocks',
    title: 'Reorder Blocks',
    description: 'Change the sequence of blocks without changing their content.',
    href: '/tools/tutorial-page-content/reorder',
    icon: ArrowUpDown,
    iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-500/25',
    badge: 'ARRAY SEQUENCE',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  {
    id: 'duplicate-block',
    title: 'Duplicate Block',
    description: 'Clone an existing block and create a new block ID.',
    href: '/tools/tutorial-page-content/duplicate',
    icon: Copy,
    iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-purple-500/25',
    badge: 'CLONE INSTANCE',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    buttonColor: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  {
    id: 'preview-page',
    title: 'Preview',
    description: 'Preview the complete tutorial page exactly as learners will see it.',
    href: '/tools/tutorial-page-content/preview',
    icon: Eye,
    iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-teal-500/25',
    badge: 'LEARNER VIEW',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    id: 'json-inspector',
    title: 'JSON Inspector',
    description: 'Inspect the canonical TutorialDocument JSON and individual block JSON.',
    href: '/tools/tutorial-page-content/json',
    icon: Code2,
    iconBg: 'bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-slate-900/25',
    badge: 'CANONICAL JSON',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    buttonColor: 'bg-slate-900 hover:bg-slate-800 text-white',
  },
];

export default function TutorialBlockComposerPage() {
  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 sm:p-8 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-pink-50 border border-pink-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#e11d48]">
                <Layers size={13} />
                BLOCK COMPOSER
              </span>
              <span className="text-xs font-semibold text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500">Tutorial Engine Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit tracking-tight">
              Create and manage tutorial block instances
            </h1>
            <p className="text-sm font-medium text-slate-500 max-w-3xl leading-relaxed">
              Build, edit, organize and preview the blocks that compose a tutorial page. The Tutorial Engine supports a single <code className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">TutorialDocument</code> containing an ordered array of independent block instances.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/tools/tutorial-page-content"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>New Block Instance</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Grid of Operation Cards (Elevated by default with rich hover highlights) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {OPERATION_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 -translate-y-1 hover:border-pink-300/80 hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-4">
                {/* Top Row: Icon Badge & Status Tag */}
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${card.iconBg}`}>
                    <Icon size={24} />
                  </div>
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono transition-colors ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-outfit tracking-tight group-hover:text-pink-600 transition-colors">
                    {card.title}
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-medium">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-100/90 flex items-center justify-between">
                <span className="text-[11px] font-mono font-medium text-slate-400">
                  {card.href.replace('/tools/tutorial-page-content', '~')}
                </span>
                <Link
                  href={card.href}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ${card.buttonColor}`}
                >
                  <span>Open</span>
                  <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architectural Concept Info Banner */}
      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-pink-50/50 p-6 sm:p-7 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-950 font-outfit">
                Canonical Document Architecture
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              In the SkillHubCore Tutorial Engine, a <strong>Tutorial Section</strong> owns a single <code className="font-mono font-bold text-indigo-900 bg-white/80 px-1.5 py-0.5 rounded border border-indigo-100">TutorialDocument</code> with an ordered <code className="font-mono font-bold text-indigo-900 bg-white/80 px-1.5 py-0.5 rounded border border-indigo-100">blocks[]</code> array. Multiple block instances of the same type/version (e.g. <em>Definition D1</em>, <em>Code C1</em>, <em>Code C1</em>) are treated as distinct instances with unique IDs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0 font-mono text-[11px]">
            <div className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-3 text-center shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model</p>
              <p className="mt-1 font-bold text-slate-800">blocks[] Array</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-3 text-center shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ordering</p>
              <p className="mt-1 font-bold text-slate-800">Array Sequence</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-3 text-center shadow-md col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Identity</p>
              <p className="mt-1 font-bold text-slate-800">Unique block.id</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
