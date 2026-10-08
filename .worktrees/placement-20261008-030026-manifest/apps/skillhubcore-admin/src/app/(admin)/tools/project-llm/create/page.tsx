'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  FileText,
  Target,
  Code,
  Image as ImageIcon,
  Columns,
  Terminal,
  Brain,
  XCircle,
  ShieldCheck,
  List,
  HelpCircle,
  Dumbbell,
  CheckSquare,
  MousePointer,
  BarChart2,
  User,
  Briefcase,
  Component,
  Search,
  Info,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ProjectLlmStepper } from '../components/ProjectLlmStepper';
import { useProjectLlm } from '../context/ProjectLlmContext';

interface FamilyItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  versionsCount: number;
  versions: Array<{
    id: string;
    title: string;
    desc: string;
  }>;
}

const FAMILIES: FamilyItem[] = [
  {
    id: 'I',
    name: 'Introduction',
    icon: FileText,
    color: 'text-pink-600 bg-pink-50 border-pink-200',
    versionsCount: 6,
    versions: [
      { id: 'I1', title: 'Simple Topic Introduction', desc: 'Basic topic introduction with clear learning context' },
      { id: 'I2', title: 'Problem → Need → Topic', desc: 'Introduce problem, highlight need, then present topic' },
      { id: 'I3', title: 'What → Why → Where', desc: 'Explain what, why it matters, and where it applies' },
      { id: 'I4', title: 'Topic → Context → Roadmap', desc: 'Present topic, provide context, and show learning roadmap' },
      { id: 'I5', title: 'Real-World Introduction', desc: 'Use real-world scenarios and examples' },
      { id: 'I6', title: 'Complete Lesson Introduction', desc: 'Comprehensive introduction with all key elements' },
    ],
  },
  {
    id: 'O',
    name: 'Objective',
    icon: Target,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    versionsCount: 4,
    versions: [
      { id: 'O1', title: 'Bullet Objectives', desc: 'Concise bullet points of lesson goals' },
      { id: 'O2', title: 'Outcome-Based Objectives', desc: 'Measurable competencies to master' },
      { id: 'O3', title: 'Bloom Taxonomy Objectives', desc: 'Cognitive tier breakdown' },
      { id: 'O4', title: 'Interactive Goal Checklist', desc: 'Student-checkable milestones' },
    ],
  },
  {
    id: 'D',
    name: 'Definition',
    icon: FileText,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    versionsCount: 5,
    versions: [
      { id: 'D1', title: 'Classic Definition', desc: 'Formal technical glossary term and definition' },
      { id: 'D2', title: 'Layman Metaphor Definition', desc: 'Everyday analogy for beginner intuition' },
      { id: 'D3', title: 'Interactive Glossary Card', desc: 'Searchable definition with live tooltips' },
      { id: 'D4', title: 'Historical Context Definition', desc: 'Origins and architectural rationale' },
      { id: 'D5', title: 'Comparative Definition', desc: 'Definitions contrasting related terms' },
    ],
  },
  {
    id: 'C',
    name: 'Code',
    icon: Code,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    versionsCount: 6,
    versions: [
      { id: 'C1', title: 'Basic Code Example', desc: 'Syntax-highlighted executable code block' },
      { id: 'C2', title: 'Annotated Code Walkthrough', desc: 'Step-by-step line explanation callouts' },
      { id: 'C3', title: 'Interactive REPL Sandbox', desc: 'Editable live playground' },
      { id: 'C4', title: 'Multi-Tab Language Snippet', desc: 'TypeScript, Python, Go tabs' },
      { id: 'C5', title: 'Error-Handling Example', desc: 'Defensive code and exception traps' },
      { id: 'C6', title: 'Production Architecture Pattern', desc: 'Enterprise design pattern sample' },
    ],
  },
  {
    id: 'V',
    name: 'Visual',
    icon: ImageIcon,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    versionsCount: 5,
    versions: [
      { id: 'V1', title: 'Static Architecture Diagram', desc: 'High-res structural graphic' },
      { id: 'V2', title: 'Interactive SVG Diagram', desc: 'Zoomable clickable nodes' },
      { id: 'V3', title: 'Animated GIF Sequence', desc: 'Step-by-step visual animation' },
      { id: 'V4', title: 'Flowchart Decision Tree', desc: 'Logic branching diagram' },
      { id: 'V5', title: 'Infographic Summary', desc: 'Graphic breakdown card' },
    ],
  },
  {
    id: 'CP',
    name: 'Comparison',
    icon: Columns,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    versionsCount: 4,
    versions: [
      { id: 'CP1', title: 'Side-by-Side Table', desc: 'Feature comparison grid' },
      { id: 'CP2', title: 'Pros & Cons Matrix', desc: 'Balanced trade-off analysis' },
      { id: 'CP3', title: 'Before vs After Block', desc: 'Refactoring transformation comparison' },
      { id: 'CP4', title: 'Competitive Tech Benchmark', desc: 'Ecosystem comparison' },
    ],
  },
  {
    id: 'E',
    name: 'Execution',
    icon: Terminal,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    versionsCount: 4,
    versions: [
      { id: 'E1', title: 'CLI Terminal Emulator', desc: 'Simulated terminal output' },
      { id: 'E2', title: 'Build Pipeline Step', desc: 'CI/CD execution step' },
      { id: 'E3', title: 'Server Log Viewer', desc: 'Log streams and debugging' },
      { id: 'E4', title: 'Benchmark Output', desc: 'Performance stats and memory profiles' },
    ],
  },
  {
    id: 'M',
    name: 'Memory',
    icon: Brain,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    versionsCount: 4,
    versions: [
      { id: 'M1', title: 'Stack vs Heap Visualizer', desc: 'Memory layout representation' },
      { id: 'M2', title: 'Garbage Collection Trace', desc: 'Lifecycle tracing' },
      { id: 'M3', title: 'Pointer Reference Diagram', desc: 'Pointers and address references' },
      { id: 'M4', title: 'Memory Footprint Analysis', desc: 'Data size optimizations' },
    ],
  },
  {
    id: 'MT',
    name: 'Mistake',
    icon: XCircle,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    versionsCount: 4,
    versions: [
      { id: 'MT1', title: 'Common Pitfalls', desc: 'Frequently made student mistakes' },
      { id: 'MT2', title: 'Anti-Pattern Warning', desc: 'Architectural bad practices' },
      { id: 'MT3', title: 'Gotcha Explanation', desc: 'Edge cases and silent bugs' },
      { id: 'MT4', title: 'Broken Code vs Fixed Code', desc: 'Side-by-side fix' },
    ],
  },
  {
    id: 'BP',
    name: 'Best Practice',
    icon: ShieldCheck,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    versionsCount: 4,
    versions: [
      { id: 'BP1', title: 'Clean Code Rule', desc: 'Industry coding conventions' },
      { id: 'BP2', title: 'Security Best Practice', desc: 'Vulnerability prevention' },
      { id: 'BP3', title: 'Performance Rule', desc: 'Runtime optimization tips' },
      { id: 'BP4', title: 'Architecture Standard', desc: 'SOLID & modular principles' },
    ],
  },
  {
    id: 'S',
    name: 'Summary',
    icon: List,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    versionsCount: 5,
    versions: [
      { id: 'S1', title: 'Quick Recap Card', desc: 'Core bullet point review' },
      { id: 'S2', title: 'Key Takeaways Grid', desc: 'High-retention summary boxes' },
      { id: 'S3', title: 'Cheatsheet Card', desc: 'Syntax cheat card' },
      { id: 'S4', title: 'Next Steps Roadmap', desc: 'Bridge to upcoming tutorial' },
      { id: 'S5', title: 'Downloadable Summary Card', desc: 'PDF / Image export summary' },
    ],
  },
  {
    id: 'Q',
    name: 'Question',
    icon: HelpCircle,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    versionsCount: 6,
    versions: [
      { id: 'Q1', title: 'Reflection Prompt', desc: 'Thought-provoking open question' },
      { id: 'Q2', title: 'FAQ Accordion', desc: 'Frequently asked questions' },
      { id: 'Q3', title: 'Discussion Trigger', desc: 'Community discussion prompt' },
      { id: 'Q4', title: 'Concept Check', desc: 'Self-assessment check' },
      { id: 'Q5', title: 'Interview Question', desc: 'Tech interview challenge' },
      { id: 'Q6', title: 'Scenario Question', desc: 'What-would-you-do scenario' },
    ],
  },
  {
    id: 'EX',
    name: 'Exercise',
    icon: Dumbbell,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    versionsCount: 4,
    versions: [
      { id: 'EX1', title: 'Guided Lab', desc: 'Step-by-step hands-on exercise' },
      { id: 'EX2', title: 'Bug Hunting Exercise', desc: 'Find and fix the error' },
      { id: 'EX3', title: 'Code Completion Exercise', desc: 'Fill-in-the-blanks snippet' },
      { id: 'EX4', title: 'Refactoring Challenge', desc: 'Improve legacy code' },
    ],
  },
  {
    id: 'T',
    name: 'Task',
    icon: CheckSquare,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    versionsCount: 4,
    versions: [
      { id: 'T1', title: 'Action Checklist', desc: 'Sequenced developer tasks' },
      { id: 'T2', title: 'Setup Task', desc: 'Environment initialization task' },
      { id: 'T3', title: 'Verification Task', desc: 'Output testing task' },
      { id: 'T4', title: 'Deployment Task', desc: 'Release staging task' },
    ],
  },
  {
    id: 'IN',
    name: 'Interactive',
    icon: MousePointer,
    color: 'text-pink-600 bg-pink-50 border-pink-200',
    versionsCount: 4,
    versions: [
      { id: 'IN1', title: 'Clickable Demo', desc: 'Interactive state controller' },
      { id: 'IN2', title: 'Parameter Slider', desc: 'Live visual parameter manipulation' },
      { id: 'IN3', title: 'Drag & Drop Sorter', desc: 'Architecture sequencing demo' },
      { id: 'IN4', title: 'Algorithm Step Simulator', desc: 'Playback execution controls' },
    ],
  },
  {
    id: 'QZ',
    name: 'Quiz',
    icon: BarChart2,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    versionsCount: 4,
    versions: [
      { id: 'QZ1', title: 'Multiple Choice Quiz', desc: 'Instant feedback 4-option quiz' },
      { id: 'QZ2', title: 'True or False Quiz', desc: 'Rapid misconception check' },
      { id: 'QZ3', title: 'Multi-Select Quiz', desc: 'Select all correct answers' },
      { id: 'QZ4', title: 'Code Prediction Quiz', desc: 'Guess the console output' },
    ],
  },
  {
    id: 'IV',
    name: 'Interview',
    icon: User,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    versionsCount: 4,
    versions: [
      { id: 'IV1', title: 'Tech Interview Scenario', desc: 'FAANG level interview question' },
      { id: 'IV2', title: 'System Design Interview', desc: 'Scalability design prompt' },
      { id: 'IV3', title: 'Behavioral & STAR Prompt', desc: 'Scenario response breakdown' },
      { id: 'IV4', title: 'Live Coding Challenge', desc: 'Timed algorithm interview' },
    ],
  },
  {
    id: 'P',
    name: 'Project',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    versionsCount: 4,
    versions: [
      { id: 'P1', title: 'Mini Project Spec', desc: 'End-of-chapter practical build' },
      { id: 'P2', title: 'Capstone Assignment', desc: 'Full-stack application milestone' },
      { id: 'P3', title: 'Real-World Client Brief', desc: 'Simulated client deliverable' },
      { id: 'P4', title: 'Portfolio Project', desc: 'Showcase-ready GitHub repository' },
    ],
  },
  {
    id: 'CU',
    name: 'Custom',
    icon: Component,
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    versionsCount: 0,
    versions: [],
  },
];

export default function CreateBlockPage() {
  const router = useRouter();
  const { state, setFamily, setTargetVersion, setPurpose, setStep } = useProjectLlm();

  const [selectedFamilyId, setSelectedFamilyId] = useState(state.familyId || 'I');
  const [targetVer, setTargetVer] = useState(state.targetVersion || 'I7');
  const [purposeText, setPurposeText] = useState(state.purpose || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExistingVersion, setSelectedExistingVersion] = useState<string | null>(null);

  const selectedFamily = useMemo(() => {
    return FAMILIES.find((f) => f.id === selectedFamilyId) || FAMILIES[0];
  }, [selectedFamilyId]);

  const filteredFamilies = useMemo(() => {
    if (!searchQuery.trim()) return FAMILIES;
    return FAMILIES.filter(
      (f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectFamily = (f: FamilyItem) => {
    setSelectedFamilyId(f.id);
    const existingIds = f.versions.map((v) => v.id);
    const defaultTarget = `${f.id}${f.versions.length + 1}`;
    setTargetVer(defaultTarget);
    setFamily(f.id, f.name, existingIds);
  };

  const handleContinue = () => {
    setTargetVersion(targetVer);
    setPurpose(purposeText);
    setStep(3); // Move to Step 3: Compliance Brief
    router.push('/tools/project-llm/compliance-brief');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Card with Title & 6-Step Workflow Stepper */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-6 shadow-xl border-t border-white/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 shrink-0">
              <Layers size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 font-outfit tracking-tight">
                  Project <span className="text-[#e11d48]">LLM</span>
                </h1>
              </div>
              <h2 className="text-lg font-bold text-slate-800 font-outfit">
                Create Educational Block
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 max-w-xl font-medium leading-relaxed">
                Select a block family, view existing versions and specify the target version for your new block.
              </p>
            </div>
          </div>

          {/* Stepper (Step 1 active) */}
          <ProjectLlmStepper currentStep={1} />
        </div>
      </div>

      {/* 2. Step 1: Select Block Family */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e11d48] text-white font-bold text-xs font-mono shadow-sm">
              1
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-outfit leading-tight">
                Select Block Family
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Choose the educational block family you want to create or update. Each family contains multiple presentation versions.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search block families..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-pink-500 transition-all"
            />
          </div>
        </div>

        {/* 19 Block Family Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {filteredFamilies.map((fam) => {
            const isSelected = selectedFamilyId === fam.id;
            const Icon = fam.icon;

            return (
              <button
                key={fam.id}
                type="button"
                onClick={() => handleSelectFamily(fam)}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[92px] ${
                  isSelected
                    ? 'border-[#e11d48] bg-pink-50/40 shadow-md ring-2 ring-pink-500/20 scale-[1.02]'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-sm'
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center mb-1.5 shadow-sm ${
                    isSelected ? 'bg-[#e11d48] text-white' : fam.color
                  }`}
                >
                  <Icon size={17} />
                </div>
                <div className="w-full">
                  <p className="text-xs font-bold text-slate-900 font-outfit truncate">{fam.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {fam.versionsCount} versions
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Two Columns: Existing Versions (Left) & Target Version (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Existing Versions */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs font-mono shadow-sm">
              2
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-outfit leading-tight">
                Existing Versions
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                These are the current versions available for the selected block family.
              </p>
            </div>
          </div>

          {/* Subheader banner */}
          <div className="rounded-xl border border-pink-100 bg-pink-50/60 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-pink-700 font-bold text-xs font-outfit">
              <selectedFamily.icon size={16} className="text-[#e11d48]" />
              <span>{selectedFamily.name} Block</span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase bg-pink-100 text-pink-700 px-2 py-0.5 rounded-md border border-pink-200">
              {selectedFamily.versions.length} Existing Versions
            </span>
          </div>

          {/* Version Rows */}
          <div className="space-y-2">
            {selectedFamily.versions.map((ver) => {
              const isChosen = selectedExistingVersion === ver.id;
              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedExistingVersion(ver.id)}
                  className={`rounded-xl border p-3 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isChosen
                      ? 'border-pink-500 bg-pink-50/30 shadow-sm ring-1 ring-pink-500/20'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isChosen ? 'border-[#e11d48] bg-[#e11d48]' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChosen && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs font-mono font-bold text-pink-700 bg-pink-50 border border-pink-200 px-1.5 py-0.2 rounded">
                      {ver.id}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-outfit">{ver.title}</h4>
                      <p className="text-[11px] text-slate-500">{ver.desc}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Details for ${ver.id}: ${ver.title}\n${ver.desc}`);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm shrink-0 transition-all"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Target Version */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-xs font-mono shadow-sm">
                3
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-outfit leading-tight">
                  Target Version
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Specify the version you want to create or update.
                </p>
              </div>
            </div>

            {/* Selected Family & Version Number Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Selected Block Family
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-pink-200 bg-pink-50/40 text-xs font-bold text-pink-700 font-outfit">
                  <selectedFamily.icon size={15} className="text-[#e11d48]" />
                  <span>{selectedFamily.name}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Target Version Number *
                  </label>
                  <Info size={12} className="text-slate-400 cursor-pointer" />
                </div>
                <input
                  type="text"
                  value={targetVer}
                  onChange={(e) => setTargetVer(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono font-bold text-slate-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  Enter next version number (e.g., I7) or existing version to update.
                </p>
              </div>
            </div>

            {/* Purpose Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 font-outfit">
                  What is the purpose of this version? *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {purposeText.length}/500
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                placeholder="Describe what this new version will do, its unique value, and how it differs from existing versions..."
                value={purposeText}
                onChange={(e) => setPurposeText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 leading-relaxed resize-none"
              />
            </div>

            {/* Next Step Info Callout Box */}
            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 flex items-start gap-2.5 text-xs text-sky-900">
              <Lightbulb size={16} className="text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sky-950 font-outfit">Next Step</p>
                <p className="text-[11px] text-sky-800 leading-relaxed mt-0.5">
                  After selecting the target version, Project LLM will generate a comprehensive compliance brief including ILS, LSNB, RSSB, Tutorial Composer, Runtime, Testing, Brand and Theme requirements.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <Link
              href="/tools/project-llm"
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span>Continue to Compliance Brief</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
