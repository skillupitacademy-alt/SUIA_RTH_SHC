'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GitBranch,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Split,
  Workflow,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface RelationshipRule {
  type:
    | 'PREDECESSOR'
    | 'SUCCESSOR'
    | 'COMPLEMENTARY'
    | 'CAN COMPOSE'
    | 'CONDITIONAL'
    | 'MUST REMAIN DISTINCT'
    | 'ALTERNATIVE'
    | 'DERIVED COMPOSITION';
  targets: string[];
  description: string;
  badgeColor: string;
}

const RELATIONSHIP_TYPES: RelationshipRule[] = [
  {
    type: 'PREDECESSOR',
    targets: ['None', 'Course Prerequisite'],
    description: 'Introduction blocks typically start the tutorial; no pedagogical predecessor required.',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    type: 'SUCCESSOR',
    targets: ['Objective O1', 'Definition D1', 'Definition D3'],
    description: 'Direct pedagogical follow-up after problem motivation is established in I2.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    type: 'COMPLEMENTARY',
    targets: ['Visual V1 (Architecture Diagram)', 'Memory M1 (Call Stack)'],
    description: 'High-synergy visual pairs that reinforce the problem statement without duplicating text.',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    type: 'CAN COMPOSE',
    targets: ['TutorialDocument.blocks[] (Downstream Composer)'],
    description: 'Cross-family composition permitted exclusively inside Tutorial Composer downstream.',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
  },
  {
    type: 'CONDITIONAL',
    targets: ['Comparison CP1', 'Mistake MT1'],
    description: 'Included only when teaching anti-patterns or contrasting alternatives for advanced learners.',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    type: 'MUST REMAIN DISTINCT',
    targets: ['Definition D1', 'Objective O1', 'Code C1'],
    description: 'Strict boundary: I2 must not contain code execution consoles or formal dictionary definitions.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    type: 'ALTERNATIVE',
    targets: ['Introduction I1 (Simple)', 'Introduction I5 (Real-World)'],
    description: 'Intra-family alternatives depending on learner profile (novice vs industry professional).',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    type: 'DERIVED COMPOSITION',
    targets: ['Introduction I7 (Intra-Family Derivation)'],
    description: 'Derived by selecting patterns from I1 (orientation) + I2 (problem) + I5 (real-world context).',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

export default function CompositionMatrixPage() {
  const [selectedTarget, setSelectedTarget] = useState('Introduction I2');

  return (
    <div className="space-y-6">
      {/* Surface Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 -translate-y-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e11d48] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded">
                SURFACE 04
              </span>
              <span className="text-xs font-semibold text-slate-400">•</span>
              <span className="text-xs font-mono font-semibold text-slate-500">RELATIONSHIP MATRIX</span>
            </div>
            <h1 className="mt-1 text-2xl font-black text-slate-900 font-outfit">
              Composition & Relationship Matrix
            </h1>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">
              Reference matrix defining allowed pedagogical pairings, predecessor/successor flows, must-remain-distinct invariants, and intra-family derivation rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tools/project-llm/mix-match"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Sparkles size={14} />
              <span>Launch Mix & Match Builder</span>
            </Link>
          </div>
        </div>

        {/* Selected Target Pill */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Active Reference Block:
          </span>
          <div className="flex items-center gap-2">
            {['Introduction I2', 'Introduction I1', 'Definition D1', 'Code C1'].map((target) => (
              <button
                key={target}
                onClick={() => setSelectedTarget(target)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedTarget === target
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {target}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matrix Tree Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RELATIONSHIP_TYPES.map((rel) => (
          <div
            key={rel.type}
            className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${rel.badgeColor}`}>
                  {rel.type}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Target: {selectedTarget}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 font-outfit">
                  {rel.targets.join(', ')}
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
                  {rel.description}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Rule Type: Canonical Contract</span>
              <span className="text-emerald-600 font-bold">ENFORCED</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
