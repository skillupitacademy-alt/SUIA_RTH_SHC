'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  FileText,
  Settings,
  Code,
  CheckCircle2,
  ShieldCheck,
  Check,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export interface StepperProps {
  currentStep: number; // 1 to 6
}

const steps = [
  { id: 1, label: 'Select Block Family', icon: Layers, href: '/tools/project-llm/create' },
  { id: 2, label: 'Choose Version', icon: FileText, href: '/tools/project-llm/create' },
  { id: 3, label: 'Compliance Brief', icon: Settings, href: '/tools/project-llm/compliance-brief' },
  { id: 4, label: 'External AI Implementation', icon: Code, href: '/tools/project-llm/external-ai-handoff' },
  { id: 5, label: 'Upload & Validate', icon: CheckCircle2, href: '/tools/project-llm/candidate-upload' },
  { id: 6, label: 'Integrate & Certify', icon: ShieldCheck, href: '/tools/project-llm/integration-certification' },
];

export function ProjectLlmStepper({ currentStep }: StepperProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto py-1 no-scrollbar shrink-0">
      {steps.map((step, idx) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.id}>
            <Link
              href={step.href}
              className={`flex flex-col items-center gap-1 group text-center cursor-pointer transition-all ${
                isCurrent
                  ? 'opacity-100 scale-105'
                  : isCompleted
                  ? 'opacity-90 hover:opacity-100'
                  : 'opacity-40 hover:opacity-60'
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-500/20'
                    : isCurrent
                    ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-500/25 ring-2 ring-orange-400/40'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isCompleted ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} />}
              </div>
              <span
                className={`text-[10px] font-bold max-w-[70px] leading-tight truncate ${
                  isCurrent
                    ? 'text-slate-900 font-outfit'
                    : isCompleted
                    ? 'text-pink-600 font-medium'
                    : 'text-slate-400 font-medium'
                }`}
              >
                {step.label}
              </span>
            </Link>

            {idx < steps.length - 1 && (
              <span className="text-slate-300 -mt-3 text-xs font-semibold select-none">→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
