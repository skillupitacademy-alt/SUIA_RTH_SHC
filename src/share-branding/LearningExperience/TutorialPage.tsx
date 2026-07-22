'use client';

import { useState, useEffect, Fragment } from 'react';
import { BrandProvider, useBrand } from '../PostLandingPage/app/context/BrandContext';
import { brands } from '../PostLandingPage/app/config/brands';
import {
  CheckCircle, Copy, Check, ChevronRight, ChevronDown,
  Zap, Brain, Code2, ArrowRight, ArrowLeft, Trophy,
  Clock, Star, Hash, AlertCircle, Play, Lightbulb,
  Database, GitBranch, Search, Bell, User,
  BookOpen, GraduationCap, List, Layers, Target,
  CheckSquare, Circle, Lock, Menu, X, BarChart2,
  Award, ExternalLink, ChevronUp, Minus
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Topic {
  id: string;
  title: string;
  duration: string;
  status: 'done' | 'active' | 'locked';
}

interface Module {
  id: string;
  title: string;
  topics: Topic[];
  expanded?: boolean;
}

// ─── Course Navigation Data ─────────────────────────────────────────────────

const MODULES: Module[] = [
  {
    id: 'python-basics',
    title: '1. Python Basics',
    expanded: false,
    topics: [
      { id: 'intro', title: 'Introduction to Python', duration: '10 min', status: 'done' },
      { id: 'variables', title: 'Variables & Data Types', duration: '15 min', status: 'done' },
      { id: 'operators', title: 'Operators', duration: '12 min', status: 'done' },
    ]
  },
  {
    id: 'python-lists',
    title: '2. Python Lists',
    expanded: true,
    topics: [
      { id: 'lists-intro', title: 'Lists — Part 1 (Basics)', duration: '25 min', status: 'active' },
      { id: 'lists-modify', title: 'Lists — Part 2 (Modify)', duration: '20 min', status: 'locked' },
      { id: 'lists-methods', title: 'List Methods', duration: '18 min', status: 'locked' },
      { id: 'lists-comprehension', title: 'List Comprehension', duration: '22 min', status: 'locked' },
    ]
  },
  {
    id: 'python-tuples',
    title: '3. Python Tuples',
    expanded: false,
    topics: [
      { id: 'tuples-intro', title: 'Introduction to Tuples', duration: '15 min', status: 'locked' },
      { id: 'tuples-ops', title: 'Tuple Operations', duration: '12 min', status: 'locked' },
    ]
  },
  {
    id: 'python-dicts',
    title: '4. Python Dictionaries',
    expanded: false,
    topics: [
      { id: 'dicts-intro', title: 'Introduction to Dicts', duration: '18 min', status: 'locked' },
    ]
  },
  {
    id: 'python-sets',
    title: '5. Python Sets',
    expanded: false,
    topics: [
      { id: 'sets-intro', title: 'Introduction to Sets', duration: '14 min', status: 'locked' },
    ]
  },
  {
    id: 'python-functions',
    title: '6. Python Functions',
    expanded: false,
    topics: [
      { id: 'functions-intro', title: 'Defining Functions', duration: '20 min', status: 'locked' },
    ]
  },
];

const TOC_ITEMS = [
  { id: 'what-is-list', label: 'What is a List?' },
  { id: 'definition', label: 'Definition' },
  { id: 'history', label: 'Historical Background' },
  { id: 'why-lists', label: 'Why Lists Exist?' },
  { id: 'problems-solved', label: 'Problems Solved' },
  { id: 'analogy', label: 'Real-World Analogy' },
  { id: 'characteristics', label: 'Characteristics' },
  { id: 'memory', label: 'Internal Memory' },
  { id: 'first-list', label: 'Creating Your First List' },
  { id: 'indexing', label: 'Indexing' },
  { id: 'nested', label: 'Nested Lists' },
  { id: 'negative-indexing', label: 'Negative Indexing' },
  { id: 'slicing', label: 'List Slicing' },
  { id: 'takeaways', label: 'Key Takeaways' },
];

// ─── Course Sidebar ─────────────────────────────────────────────────────────

function CourseSidebar() {
  const brand = useBrand();
  const [modules, setModules] = useState(MODULES);

  const toggle = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, expanded: !m.expanded } : m));
  };

  const statusIcon = (status: Topic['status']) => {
    if (status === 'done') return <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" />;
    if (status === 'active') return (
      <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center" style={{ borderColor: brand.primaryColor }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brand.primaryColor }} />
      </div>
    );
    return <Lock className="w-3.5 h-3.5 flex-shrink-0 text-slate-300" />;
  };

  return (
    <aside aria-label="Course navigation" className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: brand.primaryColor }}>
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold" style={{ color: brand.primaryColor }}>{brand.name.split(' ')[0]}</div>
          <div className="text-xs text-slate-500">Python Course</div>
        </div>
      </div>

      {/* Course Progress */}
      {/* <div className="px-5 py-3 border-b border-slate-100">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Course Progress</span>
          <span className="font-semibold" style={{ color: brand.primaryColor }}>12%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '12%', backgroundColor: brand.primaryColor }} />
        </div>
        <div className="text-xs text-slate-400 mt-1">3 of 24 topics completed</div>
      </div> */}

      {/* Module Tree */}
      <nav aria-label="Course modules" className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-2">
        {modules.map(mod => (
          <div key={mod.id}>
            <button
              onClick={() => toggle(mod.id)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
            >
              {mod.expanded
                ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
              <span className={`text-sm font-semibold flex-1 leading-snug ${mod.id === 'python-lists' ? '' : 'text-slate-600'}`}
                style={{ color: mod.id === 'python-lists' ? brand.primaryColor : undefined }}>
                {mod.title}
              </span>
            </button>
            {mod.expanded && (
              <ul className="pb-1">
                {mod.topics.map(topic => (
                  <li key={topic.id}>
                    <button
                      className="w-full flex items-center gap-2.5 pl-9 pr-4 py-2 text-left transition-colors group"
                      style={{
                        backgroundColor: topic.status === 'active' ? brand.accentBackground : undefined
                      }}
                    >
                      {statusIcon(topic.status)}
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs leading-snug truncate ${topic.status === 'active' ? 'font-semibold' :
                          topic.status === 'done' ? 'text-slate-400' : 'text-slate-400'
                          }`} style={{ color: topic.status === 'active' ? brand.primaryColor : undefined }}>
                          {topic.title}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />{topic.duration}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>

      {/* Upgrade Card */}
      {/* <div className="m-3 rounded-xl p-3 border" style={{ backgroundColor: brand.accentBackground, borderColor: brand.primaryColor + '30' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Award className="w-4 h-4" style={{ color: brand.primaryColor }} />
          <span className="text-xs font-bold" style={{ color: brand.primaryColor }}>Upgrade Your Skills</span>
        </div>
        <p className="text-xs text-slate-600 leading-snug mb-2">Get full access to all courses, projects & mentorship.</p>
        <button
          className="w-full text-xs font-semibold py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: brand.primaryColor }}
        >
          Explore Plans
        </button>
      </div> */}
    </aside>
  );
}

// ─── Top Nav Bar ────────────────────────────────────────────────────────────

function TopNav({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const brand = useBrand();
  return (
    <header aria-label="Site header" className="h-14 bg-white border-b border-slate-200 flex items-center px-5 gap-4 flex-shrink-0 z-50 relative">
      <button onClick={onToggleSidebar} aria-label="Toggle course navigation" className="p-1 hover:bg-slate-100 rounded-md transition-colors mr-1">
        <Menu className="w-5 h-5 text-slate-600" />
      </button>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0">
        <span>Python Course</span>
        <ChevronRight className="w-3 h-3" />
        <span>Python Lists</span>
        <ChevronRight className="w-3 h-3" />
        <span className="font-semibold" style={{ color: brand.primaryColor }}>Part 1 — Basics</span>
      </div>
      <div className="flex-1" />
      {/* Search */}
      {/* <div className="relative hidden md:block">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search topics..."
          className="pl-8 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-slate-400 w-48"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 hidden md:block">Bookmarks</span>
        <span className="text-xs text-slate-500 hidden md:block">Assignments</span>
        <span className="text-xs font-semibold hidden md:block" style={{ color: brand.primaryColor }}>Live Mentor</span>
      </div> */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: brand.primaryColor }}>
        AK
      </div>
    </header>
  );
}

// ─── Code Block ─────────────────────────────────────────────────────────────

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl overflow-hidden my-4 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          {label && <span className="ml-2 text-xs text-slate-400 font-mono">{label}</span>}
        </div>
        <button onClick={handleCopy} aria-label={copied ? 'Code copied' : 'Copy code'} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-slate-900 text-slate-100 p-4 overflow-x-auto text-base leading-relaxed font-mono whitespace-pre-wrap">{code}</pre>
    </div>
  );
}

// ─── Output Block ────────────────────────────────────────────────────────────

function OutputBlock({ output }: { output: string }) {
  const brand = useBrand();
  return (
    <div className="rounded-xl p-4 my-3 border-l-4 font-mono text-base bg-slate-50 shadow-sm"
      style={{ borderLeftColor: brand.primaryColor }}>
      <div className="text-sm font-bold uppercase tracking-wider mb-1.5" style={{ color: brand.primaryColorDark }}>Output</div>
      <div className="text-slate-800 whitespace-pre">{output}</div>
    </div>
  );
}

// ─── Info Box ────────────────────────────────────────────────────────────────

function InfoBox({ icon: Icon, title, children, variant = 'info' }: {
  icon: React.ElementType; title: string; children: React.ReactNode; variant?: 'info' | 'tip' | 'warning';
}) {
  const brand = useBrand();
  const colors = {
    info: { bg: brand.accentBackground, border: brand.primaryColor + '40', text: brand.primaryColor },
    tip: { bg: '#f0fdf4', border: '#86efac', text: '#16a34a' },
    warning: { bg: '#fffbeb', border: '#fbbf24', text: '#b45309' }
  };
  const c = colors[variant];
  return (
    <div className="rounded-xl p-4 my-5 border shadow-sm"
      style={{ backgroundColor: c.bg, borderColor: c.border }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: c.text + '20' }}>
          <Icon className="w-4 h-4" style={{ color: c.text }} />
        </div>
        <div>
          <div className="font-semibold text-base mb-1" style={{ color: c.text }}>{title}</div>
          <div className="text-base text-slate-700 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Heading ─────────────────────────────────────────────────────────

function SH({ id, level, children }: { id: string; level: 1 | 2 | 3; children: React.ReactNode }) {
  const brand = useBrand();
  if (level === 1) return (
    <h2 id={id} className="text-xl font-bold text-slate-800 mt-9 mb-3 scroll-mt-24 flex items-center gap-2.5">
      <span className="w-1 h-6 rounded-full flex-shrink-0 inline-block" style={{ backgroundColor: brand.primaryColor }} />
      {children}
    </h2>
  );
  if (level === 2) return <h3 id={id} className="text-base font-semibold text-slate-800 mt-6 mb-2 scroll-mt-24">{children}</h3>;
  return <h4 id={id} className="text-sm font-semibold text-slate-700 mt-4 mb-1.5 scroll-mt-24">{children}</h4>;
}

// ─── Memory Diagram ──────────────────────────────────────────────────────────

function MemoryDiagram() {
  const brand = useBrand();
  return (
    <div className="my-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">List Object — Memory Model</div>
      <div className="flex flex-col items-center gap-0">
        {/* Variable box */}
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-slate-800 text-white font-mono text-xs px-3 py-1.5 rounded font-bold">numbers</div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="text-xs text-slate-500">List Object in Heap</div>
        </div>
        {/* List slots */}
        <div className="flex rounded-lg overflow-hidden border-2" style={{ borderColor: brand.primaryColor }}>
          {['[0]', '[1]', '[2]'].map((idx, i) => (
            <div key={idx} className="flex flex-col items-center border-r border-slate-300 last:border-r-0">
              <div className="px-5 py-2 text-xs font-mono font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>{idx}</div>
              <div className="px-5 py-2 font-mono text-xs text-slate-600 bg-white">ref •</div>
            </div>
          ))}
        </div>
        {/* Arrows down */}
        <div className="flex gap-0 w-full justify-center">
          {['10', '20', '30'].map((val, i) => (
            <div key={val} className="flex flex-col items-center" style={{ width: '80px' }}>
              <div className="w-px h-5 bg-slate-300" />
              <div className="border-2 border-slate-300 rounded-lg px-4 py-2 bg-slate-50 text-center shadow-sm">
                <div className="font-mono font-bold text-slate-800 text-sm">{val}</div>
                <div className="text-xs text-slate-400">int</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center mt-3">The list holds <strong>references</strong>, not the values themselves — enabling mixed types.</p>
    </div>
  );
}

// ─── Index Diagram ───────────────────────────────────────────────────────────

function IndexDiagram({ items, highlightPos, highlightNeg }: { items: string[]; highlightPos?: number; highlightNeg?: number }) {
  const brand = useBrand();

  // Examples shown in the three cards
  const examples = [
    { label: 'First Element', idx: 0, output: items[0] },
    { label: 'Third Element', idx: 2, output: items[2] },
    { label: 'Last Element', idx: items.length - 1, output: items[items.length - 1] },
  ];

  return (
    <div className="my-5">
      {/* Index/Value table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm mb-4">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50 w-20">Index</td>
              {items.map((_, i) => {
                const isHighlighted = highlightPos === i || highlightNeg === -(items.length - i);
                return (
                  <td key={i} className="px-4 py-3 text-center font-mono font-bold border-r border-slate-200 last:border-r-0"
                    style={{ color: isHighlighted ? brand.primaryColor : '#334155', backgroundColor: isHighlighted ? brand.accentBackground : 'white' }}>
                    {highlightNeg !== undefined ? -(items.length - i) : i}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50">Value</td>
              {items.map((item, i) => {
                const isHighlighted = highlightPos === i || highlightNeg === -(items.length - i);
                return (
                  <td key={i} className="px-4 py-3 text-center font-mono border-r border-slate-200 last:border-r-0"
                    style={{ color: isHighlighted ? brand.primaryColor : '#334155', fontWeight: isHighlighted ? 700 : 400, backgroundColor: isHighlighted ? brand.accentBackground : 'white' }}>
                    '{item}'
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Code example cards — only shown for the basic indexing diagram */}
      {highlightPos === undefined && highlightNeg === undefined && (
        <div className="grid grid-cols-3 gap-3">
          {examples.map(({ label, idx, output }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <span className="text-xs font-mono" style={{ color: brand.primaryColor }}>python</span>
              </div>
              <div className="font-mono text-sm mb-3">
                <span className="font-semibold" style={{ color: brand.secondaryColor }}>print</span>
                <span className="font-semibold" style={{ color: brand.secondaryColor }}>(my_list</span>
                <span className="font-bold" style={{ color: brand.primaryColor }}>[{idx}]</span>
                <span className="font-semibold" style={{ color: brand.secondaryColor }}>)</span>
              </div>
              <div className="text-xs text-slate-600 font-semibold mb-1"># Output</div>
              <div className="font-mono font-bold" style={{ color: brand.secondaryColor }}>{output}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Nested List Diagram ─────────────────────────────────────────────────────

function NestedDiagram() {
  const brand = useBrand();
  const innerVals = ['2', '0', '1', '5'];

  return (
    <div className="flex gap-4 mb-5 items-stretch">
      {/* Left: Code Card */}
      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm min-w-0 flex flex-col justify-between relative">
        <span className="absolute top-4 right-5 text-xs font-bold" style={{ color: brand.primaryColor }}>python</span>

        <div className="font-mono text-sm mb-6 mt-1">
          <span className="font-semibold" style={{ color: brand.secondaryColor }}>n_list</span>
          <span className="text-slate-600"> = </span>
          <span className="text-slate-800 font-bold">["Happy", [2, 0, 1, 5]]</span>
        </div>

        <div className="space-y-1.5 font-mono text-sm">
          {[
            { code: 'print(n_list[', idx: '0', close: '])', comment: '# Output: Happy' },
            { code: 'print(n_list[', idx: '1', close: '])', comment: '# Output: [2, 0, 1, 5]' },
            { code: 'print(n_list[', idx: '1][3', close: '])', comment: '# Output: 5' },
          ].map(({ code, idx, close, comment }, i) => (
            <div key={i} className="flex items-center">
              <span className="w-48 flex-shrink-0">
                <span className="font-semibold" style={{ color: brand.secondaryColor }}>{code}</span>
                <span className="font-bold" style={{ color: brand.primaryColor }}>{idx}</span>
                <span className="font-semibold" style={{ color: brand.secondaryColor }}>{close}</span>
              </span>
              <span className="text-slate-500 whitespace-nowrap">{comment}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Tree Diagram Card */}
      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-center justify-center pt-6">

        {/* n_list root box */}
        <div className="px-10 py-2.5 rounded-lg text-white text-sm font-bold font-mono" style={{ backgroundColor: brand.secondaryColor }}>
          n_list
        </div>

        {/* Tree connectors */}
        <div className="relative w-full h-10 flex flex-col items-center">
          {/* Vertical red line from root */}
          <div className="w-0.5 h-6" style={{ backgroundColor: brand.primaryColor }}></div>
          {/* Red diamond */}
          <div className="absolute top-3 w-2.5 h-2.5 rotate-45" style={{ backgroundColor: brand.primaryColor }}></div>

          {/* Horizontal dark line */}
          <div className="w-56 h-0.5 bg-slate-700 mt-0"></div>

          {/* Left vertical line and arrowhead */}
          <div className="absolute top-6 left-1/2 -translate-x-28">
            <div className="w-0.5 h-4 bg-slate-700 mx-auto"></div>
            <svg width="8" height="6" viewBox="0 0 8 6" className="fill-slate-700 mx-auto -mt-1"><path d="M0 0L8 0L4 6Z" /></svg>
          </div>

          {/* Right vertical line and arrowhead */}
          <div className="absolute top-6 left-1/2 translate-x-[4.5rem]">
            <div className="w-0.5 h-4 bg-slate-700 mx-auto"></div>
            <svg width="8" height="6" viewBox="0 0 8 6" className="fill-slate-700 mx-auto -mt-1"><path d="M0 0L8 0L4 6Z" /></svg>
          </div>
        </div>

        {/* Two child cells */}
        <div className="flex gap-4 items-start w-full justify-center pl-8">
          {/* "Happy" cell */}
          <div className="flex flex-col items-center -ml-16">
            <div className="border border-slate-300 rounded-lg px-3 py-3 font-mono text-sm font-bold bg-white text-slate-800 shadow-sm"
              style={{ borderColor: brand.primaryColor, backgroundColor: brand.accentBackground }}>
              "Happy"
            </div>
          </div>

          {/* Inner list: 4 dot cells */}
          <div className="flex flex-col items-center">
            <div className="flex border rounded-lg shadow-sm" style={{ borderColor: brand.primaryColor, backgroundColor: brand.accentBackground }}>
              {innerVals.map((_, i) => (
                <div key={i} className="w-9 h-11 flex items-center justify-center border-r last:border-r-0" style={{ borderColor: brand.primaryColor + '40' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                </div>
              ))}
            </div>

            {/* Arrows down from each dot */}
            <div className="flex mt-1">
              {innerVals.map((_, i) => (
                <div key={i} className="w-9 flex flex-col items-center">
                  <div className="w-0.5 h-5" style={{ backgroundColor: brand.primaryColor }} />
                  <svg width="8" height="6" viewBox="0 0 8 6" className="-mt-1" style={{ fill: brand.primaryColor }}><path d="M0 0L8 0L4 6Z" /></svg>
                </div>
              ))}
            </div>

            {/* Values */}
            <div className="flex mt-1">
              {innerVals.map((v, i) => (
                <div key={i} className="w-9 text-center font-mono font-bold text-sm text-slate-800">{v}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Negative Index Diagram ──────────────────────────────────────────────────

function NegativeIndexDiagram() {
  const brand = useBrand();
  const items = ['p', 'r', 'o', 'b', 'e'];
  const posIndices = [0, 1, 2, 3, 4];
  const negIndices = [-5, -4, -3, -2, -1];

  return (
    <div className="my-5 flex flex-col gap-4">
      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <tbody>
            {/* Positive Index Row */}
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 font-bold border-r border-slate-200 w-36 bg-white" style={{ color: brand.secondaryColor }}>Positive Index</td>
              {posIndices.map((idx, i) => (
                <td key={i} className="px-4 py-3 text-center font-mono font-bold text-slate-800 border-r border-slate-200 last:border-r-0 bg-white">
                  {idx}
                </td>
              ))}
            </tr>
            {/* Values Row */}
            <tr className="border-b border-slate-200">
              <td className="px-4 py-3 border-r border-slate-200 bg-white"></td>
              {items.map((item, i) => (
                <td key={i} className="px-4 py-3 text-center font-mono font-bold border-r border-slate-200 last:border-r-0 bg-white" style={{ color: brand.secondaryColor }}>
                  {item}
                </td>
              ))}
            </tr>
            {/* Negative Index Row */}
            <tr>
              <td className="px-4 py-3 font-bold border-r border-slate-200 bg-white" style={{ color: brand.secondaryColor }}>Negative Index</td>
              {negIndices.map((idx, i) => (
                <td key={i} className="px-4 py-3 text-center font-mono font-bold text-slate-800 border-r border-slate-200 last:border-r-0 bg-white">
                  {idx}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Code Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-sm" style={{ color: brand.secondaryColor }}>Last Element</span>
            <span className="font-bold text-xs" style={{ color: brand.primaryColor }}>python</span>
          </div>
          <div className="font-mono text-sm mb-4">
            <span className="font-semibold" style={{ color: brand.secondaryColor }}>print</span>
            <span className="font-semibold" style={{ color: brand.secondaryColor }}>(my_list[</span>
            <span className="font-bold" style={{ color: brand.primaryColor }}>-1</span>
            <span className="font-semibold" style={{ color: brand.secondaryColor }}>])</span>
          </div>
          <div className="font-mono text-sm text-slate-700 font-semibold mb-1"># Output</div>
          <div className="font-mono text-sm font-bold" style={{ color: brand.secondaryColor }}>e</div>
        </div>

        {/* Card 2 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-sm" style={{ color: brand.secondaryColor }}>First Element (from negative)</span>
            <span className="font-bold text-xs" style={{ color: brand.primaryColor }}>python</span>
          </div>
          <div className="font-mono text-sm mb-4">
            <span className="font-semibold" style={{ color: brand.secondaryColor }}>print</span>
            <span className="font-semibold" style={{ color: brand.secondaryColor }}>(my_list[</span>
            <span className="font-bold" style={{ color: brand.primaryColor }}>-5</span>
            <span className="font-semibold" style={{ color: brand.secondaryColor }}>])</span>
          </div>
          <div className="font-mono text-sm text-slate-700 font-semibold mb-1"># Output</div>
          <div className="font-mono text-sm font-bold" style={{ color: brand.secondaryColor }}>p</div>
        </div>
      </div>
    </div>
  );
}

// ─── Slicing Visualizer ──────────────────────────────────────────────────────

function SlicingVisualizer() {
  const brand = useBrand();
  const [start, setStart] = useState(2);
  const [stop, setStop] = useState(5);
  const items = ['p', 'r', 'o', 'b', 'e'];
  const isIn = (i: number) => i >= start && i < stop;

  return (
    <div className="my-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Interactive Slice Explorer</div>
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <label className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-600 font-medium w-8" id="slice-start-label">start</span>
          <input type="number" min={0} max={5} value={start} onChange={e => setStart(+e.target.value)}
            aria-labelledby="slice-start-label" aria-label="Slice start index"
            className="w-12 border border-slate-300 rounded px-2 py-1 text-center font-mono text-sm focus:outline-none" style={{ borderColor: brand.primaryColor + '60' }} />
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-600 font-medium w-8" id="slice-stop-label">stop</span>
          <input type="number" min={0} max={5} value={stop} onChange={e => setStop(+e.target.value)}
            aria-labelledby="slice-stop-label" aria-label="Slice stop index"
            className="w-12 border border-slate-300 rounded px-2 py-1 text-center font-mono text-sm focus:outline-none" style={{ borderColor: brand.primaryColor + '60' }} />
        </label>
        <div className="px-3 py-1.5 rounded-lg font-mono text-sm font-bold" style={{ backgroundColor: brand.accentBackground, color: brand.primaryColor }}>
          my_list[{start}:{stop}]
        </div>
      </div>
      <div className="flex rounded-lg overflow-hidden border-2" style={{ borderColor: brand.primaryColor + '40' }}>
        {items.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center h-14 border-r border-slate-200 last:border-r-0 transition-all duration-200"
            style={{ backgroundColor: isIn(i) ? brand.primaryColor : 'white', color: isIn(i) ? 'white' : '#94a3b8' }}>
            <span className="text-xs opacity-60 mb-0.5">[{i}]</span>
            <span className="font-mono font-bold text-base">{item}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm text-center text-slate-700">
        Result: <code className="font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: brand.accentBackground, color: brand.primaryColor }}>
          [{items.filter((_, i) => isIn(i)).map(c => `'${c}'`).join(', ')}]
        </code>
      </div>
      <p className="text-xs text-slate-400 text-center mt-1">start is <strong>inclusive</strong> · stop is <strong>exclusive</strong></p>
    </div>
  );
}

// ─── Characteristics Table ───────────────────────────────────────────────────

function CharacteristicsTable() {
  const brand = useBrand();
  const rows: [string, boolean][] = [
    ['Ordered', true], ['Mutable', true], ['Duplicate Values', true], ['Dynamic Size', true],
    ['Mixed Data Types', true], ['Nested Lists', true], ['Indexing', true], ['Slicing', true],
  ];
  return (
    <div className="my-5 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="grid grid-cols-2">
        <div className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider">Feature</div>
        <div className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider">Supported</div>
        {rows.map(([feature], i) => (
          <Fragment key={feature}>
            <div className={`px-4 py-3 text-sm text-slate-700 font-medium border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>{feature}</div>
            <div className={`px-4 py-3 border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" style={{ color: brand.primaryColor }} />
                <span className="text-sm font-medium" style={{ color: brand.primaryColor }}>Yes</span>
              </span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

function RightPanel({ activeId }: { activeId: string }) {
  const brand = useBrand();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setCompleted(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const keyTakeaways = [
    'Ordered, mutable, dynamic collection',
    'Stores references, not values directly',
    'Indexing starts at 0',
    'Negative indexing from -1 backward',
    'Nested lists for hierarchical data',
    'Slicing: start inclusive, stop exclusive',
  ];

  return (
    <aside aria-label="On this page" className="w-64 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-8 px-6 hidden lg:flex">
      {/* TOC */}
      <div className="flex-1">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">On this page</div>
        <ul className="space-y-3">
          {TOC_ITEMS.map(item => (
            <li key={item.id} className="flex items-center gap-2">
              <button
                onClick={() => toggle(item.id)}
                aria-label={completed.has(item.id) ? `Mark "${item.label}" as incomplete` : `Mark "${item.label}" as complete`}
                aria-pressed={completed.has(item.id)}
                className="w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-all mt-0.5"
                style={{ borderColor: completed.has(item.id) ? brand.primaryColor : '#cbd5e1', backgroundColor: completed.has(item.id) ? brand.primaryColor : 'transparent' }}>
                {completed.has(item.id) && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
              <a href={`#${item.id}`}
                className="text-sm leading-snug transition-colors flex-1"
                style={{
                  color: activeId === item.id ? brand.primaryColor : completed.has(item.id) ? '#94a3b8' : '#334155',
                  fontWeight: activeId === item.id ? 600 : 400,
                  textDecoration: completed.has(item.id) ? 'line-through' : 'none'
                }}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Progress */}
      {/* <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4" style={{ color: brand.primaryColor }} />
          <span className="text-xs font-bold text-slate-700">Your Progress</span>
        </div>
        <div className="flex items-end gap-1 mb-1.5">
          <span className="text-2xl font-bold" style={{ color: brand.primaryColor }}>
            {Math.round((completed.size / TOC_ITEMS.length) * 100)}%
          </span>
          <span className="text-xs text-slate-400 mb-0.5">done</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(completed.size / TOC_ITEMS.length) * 100}%`, backgroundColor: brand.primaryColor }} />
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
          <Clock className="w-3 h-3" /><span>~25 min read</span>
        </div>
      </div> */}

      {/* Key Takeaways */}
      {/* <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-700">Key Takeaways</span>
        </div>
        <ul className="space-y-2">
          {keyTakeaways.map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold"
                style={{ backgroundColor: brand.primaryColor, fontSize: '9px' }}>{i + 1}</div>
              <span className="text-xs text-slate-600 leading-snug">{t}</span>
            </li>
          ))}
        </ul>
      </div> */}

      {/* Promo Card */}
      {/* <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-4" style={{ backgroundColor: brand.primaryColor }}>
          <div className="text-white font-bold text-sm leading-snug mb-1">
            Master Python with<br />{brand.name}
          </div>
          <div className="text-white text-xs opacity-80">Complete Python Bootcamp</div>
        </div>
        <div className="bg-white p-4">
          <div className="space-y-2 mb-3">
            {[
              { label: 'Topics Completed', value: '3 / 24' },
              { label: 'Quizzes Passed', value: '1 / 8' },
              { label: 'Projects Done', value: '0 / 3' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>
          <button className="w-full text-xs font-bold py-2 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: brand.primaryColor }}>
            Explore Python Course
          </button>
        </div>
      </div> */}

      {/* Chapter Nav */}
      {/* <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-2">
        <button className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors py-1">
          <ArrowLeft className="w-3.5 h-3.5" />Python Operators
        </button>
        <div className="border-t border-slate-100" />
        <button className="w-full flex items-center justify-between text-xs font-semibold hover:opacity-80 transition-colors py-1"
          style={{ color: brand.primaryColor }}>
          Lists Part 2<ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div> */}
    </aside>
  );
}

// ─── Main Article ─────────────────────────────────────────────────────────────

function ArticleContent({ onActiveChange }: { onActiveChange: (id: string) => void }) {
  const brand = useBrand();
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) onActiveChange(e.target.id); }); },
      { rootMargin: '-15% 0px -70% 0px' }
    );
    TOC_ITEMS.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [onActiveChange]);

  const quizOptions = [
    'Lists store the actual values directly.',
    'Lists store references (memory addresses) to objects.',
    'Lists only hold integers.',
    'Lists have a fixed size at creation.',
  ];

  return (
    <main id="main-content" className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white">
      <article>
      {/* Article Header — bg uses accentBackground; text must pass 4.5:1 contrast on that bg */}
      <header aria-label="Article header" className="border-b border-slate-100 px-8 py-6" style={{ backgroundColor: brand.accentBackground }}>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Python Fundamentals</span>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <span className="font-bold" style={{ color: brand.primaryColorDark }}>Chapter 2 · Lists</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Python Lists — Part 1</h1>
        <p className="text-slate-600 text-base mb-4">Based on the uploaded notebook: List Basics, Indexing, Nested Lists, Negative Indexing, and Slicing.</p>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-sm text-slate-600"><Clock className="w-4 h-4" aria-hidden="true" />~25 min</span>
          <span className="flex items-center gap-1.5 text-sm text-slate-600"><Code2 className="w-4 h-4" aria-hidden="true" />12 examples</span>
          <span className="flex items-center gap-1.5 text-sm text-slate-600"><Target className="w-4 h-4" aria-hidden="true" />1 quiz</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: brand.primaryColorDark }}>Beginner</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Free Topic</span>
        </div>
      </header>

      <div className="px-8 py-6 w-full">

        {/* What is a List */}
        <SH id="what-is-list" level={1}>What is a List?</SH>
        <p className="text-slate-700 leading-relaxed mb-3 text-base">
          A <strong>List</strong> is one of Python's most powerful built-in data structures. It stores <strong>multiple values in a single variable</strong> while maintaining insertion order. Lists are flexible — they can hold integers, floats, strings, Booleans, objects, functions, or even other lists.
        </p>
        <p className="text-slate-700 leading-relaxed mb-3 text-base">
          Unlike fixed-size arrays in C or Java, Python lists are <strong>dynamic</strong> — size adjusts automatically at runtime without manual memory management. Used across AI, ML, data science, web development, DevOps, and more.
        </p>

        {/* Definition */}
        <SH id="definition" level={1}>Definition</SH>
        <p className="text-base text-slate-700 leading-relaxed mb-3">
          A <strong>Python List</strong> is an <strong>ordered, mutable, dynamic collection of objects</strong> enclosed in square brackets <code className="bg-slate-100 px-1 rounded text-xs">[]</code>.
        </p>
        <CodeBlock code={`my_list = [10, 20, 30, 40]`} label="python" />
        <div className="grid grid-cols-2 gap-2 my-3">
          {[['my_list', 'Variable name'], ['[10, 20, 30, 40]', 'The list object'], ['4 elements', 'Total items stored'], ['0 → 3', 'Index of each element']].map(([t, d]) => (
            <div key={t} className="flex items-start gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <code className="text-xs font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: brand.accentBackground, color: brand.primaryColor }}>{t}</code>
              <span className="text-xs text-slate-500">{d}</span>
            </div>
          ))}
        </div>

        {/* History */}
        <SH id="history" level={1}>Historical Background</SH>
        <p className="text-base text-slate-700 leading-relaxed mb-3">
          Python was created by <strong>Guido van Rossum in 1991</strong> with a key goal: make programming intuitive. Earlier languages used fixed-size arrays requiring manual memory management. Python's <strong>lists</strong> changed that — automatic resizing, no manual allocation.
        </p>
        <div className="grid grid-cols-4 gap-1.5 my-3">
          {['AI & ML', 'Data Science', 'Automation', 'Web Dev', 'Cloud', 'DevOps', 'Backend APIs', 'IoT'].map(tag => (
            <div key={tag} className="text-xs font-medium text-center py-1.5 rounded-lg" style={{ backgroundColor: brand.accentBackground, color: brand.primaryColor }}>{tag}</div>
          ))}
        </div>

        {/* Why Lists */}
        <SH id="why-lists" level={1}>Why Do Lists Exist?</SH>
        <p className="text-base text-slate-700 leading-relaxed mb-2">Consider a student management system for 10,000 students:</p>
        <div className="grid grid-cols-2 gap-3 my-3">
          <div>
            <div className="text-xs font-semibold text-red-600 mb-1">❌ Without Lists</div>
            <CodeBlock code={`student1 = "John"\nstudent2 = "Alice"\n# ... 9,998 more variables`} label="python" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-600 mb-1">✅ With Lists</div>
            <CodeBlock code={`students = [\n  "John", "Alice",\n  # ... 9,998 more\n]`} label="python" />
          </div>
        </div>

        {/* Problems Solved */}
        <SH id="problems-solved" level={1}>Problems Solved by Lists</SH>
        <div className="grid grid-cols-2 gap-3 my-3">
          <div className="rounded-xl border-2 border-red-100 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-red-500" /><span className="font-bold text-red-700 text-sm">Before Lists</span></div>
            <ul className="space-y-1.5">
              {['Multiple variables', 'Difficult searching', 'Difficult looping', 'Hard maintenance', 'Fixed memory'].map(i => (
                <li key={i} className="flex items-center gap-2 text-xs text-red-700"><span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{i}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border-2 border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="font-bold text-emerald-700 text-sm">After Lists</span></div>
            <ul className="space-y-1.5">
              {['Store thousands together', 'Easy iteration', 'Easy insertion/deletion', 'Dynamic resizing', 'Efficient manipulation'].map(i => (
                <li key={i} className="flex items-center gap-2 text-xs text-emerald-700"><CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />{i}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Analogy */}
        <SH id="analogy" level={1}>Real-World Analogy — Bookshelf</SH>
        <p className="text-base text-slate-700 leading-relaxed mb-3">
          Think of a <strong>bookshelf</strong>. Instead of "first book, second book…" you use position numbers.
        </p>
        <div className="rounded-xl border border-slate-200 p-4 my-3 bg-slate-50">
          <div className="flex gap-1.5 mb-2 justify-center">
            {['Python', 'Java', 'C++', 'Go', 'AI'].map((book, i) => (
              <div key={book} className="flex flex-col items-center gap-1 w-14">
                <div className="w-full h-20 rounded-sm flex items-end justify-center pb-2 text-white shadow-sm"
                  style={{ backgroundColor: [brand.primaryColor, '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i], writingMode: 'vertical-lr' }}>
                  <span className="text-xs font-bold text-white" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>{book}</span>
                </div>
                <div className="text-xs font-mono text-slate-500">[{i}]</div>
              </div>
            ))}
          </div>
          <div className="h-2.5 bg-amber-700 rounded-sm" />
          <p className="text-xs text-slate-400 text-center mt-2">Each position has an index — just like Python lists!</p>
        </div>

        {/* Characteristics */}
        <SH id="characteristics" level={1}>Characteristics of Lists</SH>
        <CharacteristicsTable />

        {/* Memory */}
        <SH id="memory" level={1}>Internal Memory Representation</SH>
        <InfoBox icon={Brain} title="Interview-Critical Concept" variant="warning">
          Python lists do <strong>not</strong> store values directly. They store <strong>references (memory addresses)</strong> to objects — which is why a single list can hold different types.
        </InfoBox>
        <CodeBlock code={`numbers = [10, 20, 30]`} label="python" />
        <MemoryDiagram />

        {/* First List */}
        <SH id="first-list" level={1}>Creating Your First List</SH>
        <CodeBlock code={`my_list = ['p', 'r', 'o', 'b', 'e']`} label="python" />
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 my-3">
          {[
            { n: 1, t: "Python creates five string objects: 'p', 'r', 'o', 'b', 'e'" },
            { n: 2, t: "Python creates one list object with five reference slots" },
            { n: 3, t: "The variable my_list points to the list object in heap memory" },
          ].map(({ n, t }) => (
            <div key={n} className="flex items-start gap-2.5 mb-2 last:mb-0">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: brand.primaryColor }}>{n}</div>
              <p className="text-xs text-slate-600 mt-0.5">{t}</p>
            </div>
          ))}
        </div>
        <CodeBlock code={`print(my_list)`} label="python" />
        <OutputBlock output="['p', 'r', 'o', 'b', 'e']" />

        {/* Indexing */}
        <SH id="indexing" level={1}>Indexing</SH>
        <p className="text-base text-slate-700 leading-relaxed mb-3">Every element inside a list has an <strong>index</strong>. Python starts counting from <strong>0</strong>.</p>
        <IndexDiagram items={['p', 'r', 'o', 'b', 'e']} />
        <SH id="idx-examples" level={2}>Accessing Elements</SH>
        <CodeBlock code={`print(my_list[0])   # p  — first element\nprint(my_list[2])   # o  — third element (0→p, 1→r, 2→o)\nprint(my_list[4])   # e  — last element`} label="python" />
        <OutputBlock output={"p\no\ne"} />

        {/* Nested */}
        <SH id="nested" level={1}>Nested Lists (List of Lists)</SH>
        <p className="text-base text-slate-700 leading-relaxed mb-3">
          A list can contain another list as an element.
        </p>
        <NestedDiagram />
        <InfoBox icon={Lightbulb} title="How n_list[1][3] works" variant="tip">
          Step 1: <code>n_list[1]</code> → <code>[2, 0, 1, 5]</code>&nbsp;&nbsp;<br />
          Step 2: access <code>[3]</code> from that inner list → <strong>5</strong>
        </InfoBox>

        {/* Negative Indexing */}
        <SH id="negative-indexing" level={1}>Negative Indexing</SH>
        <p className="text-base text-slate-700 leading-relaxed mb-3">
          Python supports counting from the <strong>end</strong> using negative numbers. <code className="bg-slate-100 px-1 rounded text-xs">-1</code> = last element, <code className="bg-slate-100 px-1 rounded text-xs">-5</code> = first element (for a 5-item list).
        </p>
        <NegativeIndexDiagram />
        <InfoBox icon={Lightbulb} title="When to use negative indexing" variant="tip">
          Useful when you need the <strong>last N elements</strong> without knowing the exact length of the sequence.
        </InfoBox>

        {/* Slicing */}
        <SH id="slicing" level={1}>List Slicing</SH>
        <p className="text-base text-slate-700 leading-relaxed mb-2">Retrieve a <strong>portion</strong> of a list using:</p>
        <CodeBlock code={`list[start:stop]   # start included, stop excluded`} label="syntax" />
        <SlicingVisualizer />
        <CodeBlock code={`my_list = ['p', 'r', 'o', 'b', 'e']\n\nprint(my_list[2:5])    # ['o', 'b', 'e']\nprint(my_list[1:3])    # ['r', 'o']\nprint(my_list[${'-4:-1'}])  # ['r', 'o', 'b']`} label="python" />
        <OutputBlock output={"['o', 'b', 'e']\n['r', 'o']\n['r', 'o', 'b']"} />

        {/* Key Takeaways */}
        <SH id="takeaways" level={1}>Key Takeaways — Part 1</SH>
        <div className="rounded-xl border border-slate-200 overflow-hidden my-4">
          {[
            { icon: List, text: 'Ordered, mutable, and dynamically sized collection.' },
            { icon: Database, text: 'Stores references to objects — heterogeneous types allowed.' },
            { icon: Hash, text: 'Indexing from 0; negative indexing from -1 backward.' },
            { icon: Layers, text: 'Nested lists enable hierarchical data structures.' },
            { icon: GitBranch, text: 'Slicing: start is inclusive, stop is exclusive.' },
            { icon: Zap, text: 'Foundation of AI, ML, data science, and web development.' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: brand.accentBackground }}>
                <Icon className="w-3 h-3" style={{ color: brand.primaryColor }} />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* Quiz */}
        <div className="rounded-xl border-2 my-6 overflow-hidden shadow-sm" style={{ borderColor: brand.primaryColor + '40' }}>
          <div className="px-5 py-3" style={{ backgroundColor: brand.accentBackground }}>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" style={{ color: brand.primaryColor }} />
              <span className="font-bold text-slate-800 text-sm">Knowledge Check</span>
            </div>
          </div>
          <div className="p-5 bg-white">
            <p className="font-semibold text-slate-800 mb-3 text-sm">How does Python actually store elements inside a list?</p>
            <div className="space-y-2">
              {quizOptions.map((opt, i) => (
                <button key={i} onClick={() => !quizSubmitted && setQuizAnswer(i)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border-2 text-xs transition-all ${quizAnswer === i ? 'border-current font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300'} ${quizSubmitted ? i === 1 ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : quizAnswer === i ? 'border-red-400 bg-red-50 text-red-800' : 'opacity-50' : ''}`}
                  style={quizAnswer === i && !quizSubmitted ? { borderColor: brand.primaryColor, color: brand.primaryColor, backgroundColor: brand.accentBackground } : {}}>
                  <span className="font-mono mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              ))}
            </div>
            {!quizSubmitted
              ? <button onClick={() => quizAnswer !== null && setQuizSubmitted(true)} disabled={quizAnswer === null}
                className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition-all"
                style={{ backgroundColor: brand.primaryColor }}>Submit Answer</button>
              : <div className={`mt-3 rounded-lg p-3 ${quizAnswer === 1 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-1.5 font-semibold mb-1 text-xs" style={{ color: quizAnswer === 1 ? '#059669' : '#dc2626' }}>
                  {quizAnswer === 1 ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {quizAnswer === 1 ? 'Correct!' : 'Not quite.'}
                </div>
                <p className="text-xs text-slate-700">Python lists store <strong>references (memory addresses)</strong> — not the values directly. This allows mixed types in a single list.</p>
              </div>}
          </div>
        </div>

        {/* Next CTA */}
        <div className="rounded-xl border border-slate-200 p-5 my-4 bg-slate-50">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Up Next</div>
              <h3 className="font-bold text-slate-800 text-base">Python Lists — Part 2</h3>
              <p className="text-xs text-slate-500 mt-1">Modifying lists: append(), extend(), insert(), concatenation, and repetition.</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-semibold text-xs shadow-sm hover:opacity-90 transition-all" style={{ backgroundColor: brand.primaryColor }}>
                <Play className="w-3.5 h-3.5" />Continue to Part 2
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-600 font-semibold text-xs border border-slate-200 bg-white hover:bg-slate-50 transition-all">
                <ArrowLeft className="w-3.5 h-3.5" />Back
              </button>
            </div>
          </div>
        </div>

      </div>
      </article>
    </main>
  );
}

// ─── Tutorial Layout ──────────────────────────────────────────────────────────

function TutorialLayout() {
  const [activeId, setActiveId] = useState('what-is-list');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      {/* Skip to main content link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      <TopNav onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 min-h-0 relative">
        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="absolute inset-0 bg-black/20 z-40 transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`absolute top-0 left-0 h-full z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <CourseSidebar />
        </div>

        {/* Center + Right */}
        <div className="flex-1 flex min-h-0 overflow-hidden w-full">
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
            <ArticleContent onActiveChange={setActiveId} />
          </div>
          <RightPanel activeId={activeId} />
        </div>
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

interface TutorialPageProps {
  brand: 'rth' | 'skillup';
}

export function TutorialPage({ brand: brandKey }: TutorialPageProps) {
  const brand = brands[brandKey];
  return (
    <BrandProvider brand={brand}>
      <TutorialLayout />
    </BrandProvider>
  );
}
