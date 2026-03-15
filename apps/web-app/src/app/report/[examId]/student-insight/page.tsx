"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";

// Types based on the formatter output
interface StudentInsightData {
  meta: {
    candidateName: string;
    candidateEmail: string;
    vectorId: string;
    examId: string;
    startedAt: string;
    lineage: {
      domain: string;
      subject: string;
      topic: string;
    };
    totalQuestions: number;
  };
  behaviour: {
    timePattern: string | null;
    stableCount: number;
    logicCount: number;
    errorCount: number;
  };
  knowledgeGap: {
    l1: Array<{ subject: string; accuracyPct: number }>;
    l2: Array<{ topic: string; accuracyPct: number }>;
    l3: Array<{ dimension: string; currentValue: number }>;
  };
  skills: {
    profile: Array<{ skillName: string; accuracyPct: number }>;
    byTopic: Array<{ topic: string; skillName: string; accuracyPct: number }>;
    top3Weakest: Array<{ skillName: string; accuracyPct: number }>;
  };
  priorities: Array<{
    severity: string;
    hierarchy: string;
    recommendation: string;
    currentValue: number;
  }>;
  progress: Array<{
    subtopic: string | null;
    topic: string | null;
    accuracyPct: number | null;
    sessionIndex: number;
  }>;
  nextSteps: {
    nextExamHours: number;
    score: number;
    criticalGap?: {
      dimension: string;
      hierarchy: string;
    };
    weakestSubtopic: string | null;
  };
}

export default function StudentInsightPdfPage() {
  const { examId } = useParams();
  const [data, setData] = useState<StudentInsightData | null>(null);

  useEffect(() => {
    // 1. Try injected data from Puppeteer
    const injected = (globalThis as unknown as { __REPORT_DATA__?: StudentInsightData }).__REPORT_DATA__;
    if (injected) {
      setData(injected);
      return;
    }

    // 2. Otherwise fetch (for dev/preview)
    // Note: In production, the PDF service injects the data
  }, [examId]);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center font-inter">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synthesizing Insight Vector...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] min-h-screen flex flex-col items-center py-20 print:p-0 font-inter">
      {/* Page 1: Performance Story */}
      <Page>
        <Header data={data} />
        
        <Section title="YOUR BEHAVIOUR TODAY" subheading="Cognitive Pattern Analysis">
          <BehaviourAnalysis data={data} />
        </Section>

        <Section title="YOUR EXACT KNOWLEDGE GAP" subheading="From Broad to Precise">
          <KnowledgeGapAnalysis data={data} />
        </Section>
        
        <Footer data={data} page={1} />
      </Page>

      {/* Page 2: Skill Intelligence */}
      <Page>
        <Section title="YOUR SKILL PROFILE" subheading="All Cognitive Skills Assessed">
          <SkillProfile data={data} />
        </Section>

        <Section title="SKILLS BREAKDOWN BY TOPIC" subheading="Which skills failed where">
          <SkillsByTopic data={data} />
        </Section>

        <Section title="YOUR 3 PRIORITY SKILLS" subheading="Focus here in your next study session">
          <PrioritySkills data={data} />
        </Section>

        <Footer data={data} page={2} />
      </Page>

      {/* Page 3: Study Roadmap */}
      <Page>
        <Section title="THIS WEEK - YOUR 3 PRIORITIES" subheading="Ranked by urgency">
          <PrioritySignals data={data} />
        </Section>

        <Section title="YOUR PROGRESS OVER TIME" subheading="">
          <ProgressHistory data={data} />
        </Section>

        <Section title="YOUR NEXT STEPS" subheading="">
          <NextSteps data={data} />
        </Section>

        <Footer data={data} page={3} />
      </Page>

      {/* Signal for Puppeteer */}
      <div id="pdf-ready-signal" data-pdf-ready="true" className="hidden" />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        @page {
          size: A4;
          margin: 0;
        }

        body {
          margin: 0;
          padding: 0;
          background-color: #020617;
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
        }
      `}</style>
    </div>
  );
}

// --- Layout Components ---

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-[#020617] text-white overflow-hidden shadow-2xl mb-10 print:mb-0 print:shadow-none" style={{
      width: '1200px', // Exactly 1200px as per core rules
      height: '1600px', // Exactly 1600px for A4 pixel-perfection
      padding: '60px',
      pageBreakAfter: 'always'
    }}>
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}

function Section({ title, subheading, children }: { title: string; subheading: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-[0.2em] text-white uppercase italic">{title}</h2>
        {subheading && <p className="text-indigo-400 font-bold tracking-widest text-xs uppercase mt-1">{subheading}</p>}
        <div className="h-0.5 w-12 bg-indigo-600 mt-3" />
      </div>
      {children}
    </div>
  );
}

// --- CONTENT COMPONENTS ---

function Header({ data }: { data: StudentInsightData }) {
  return (
    <div className="flex justify-between items-start mb-20">
      <div>
        <div className="text-xl font-black tracking-[0.4em] text-white mb-1">NEURAL DIAGNOSTICS</div>
        <div className="h-1 w-12 bg-indigo-600" />
      </div>
      
      <div className="flex gap-4">
        <div className="bg-slate-900/80 border border-white/5 px-4 py-2 rounded-xl text-right">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Vector Source</div>
          <div className="text-xs font-black text-white">{data.meta?.vectorId || 'ANALYSIS-ALPHA-10'}</div>
        </div>
        <div className="bg-slate-900/80 border border-white/5 px-4 py-2 rounded-xl text-right">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Date</div>
          <div className="text-xs font-black text-white">{format(new Date(), 'MMMM dd, yyyy')}</div>
        </div>
      </div>

      <div className="absolute top-[200px] left-1/2 -translate-x-1/2 text-center w-full">
        <h1 className="text-7xl font-black text-white tracking-tight mb-2 uppercase italic">{data.meta?.candidateName || 'Strategic Officer'}</h1>
        <div className="text-indigo-400 font-black tracking-[0.5em] text-sm uppercase mb-6">STUDENT INSIGHT REPORT</div>
        <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          <span>{data.meta?.lineage?.domain}</span>
          <span className="text-indigo-600">/</span>
          <span>{data.meta?.lineage?.subject}</span>
          <span className="text-indigo-600">/</span>
          <span className="text-white">{data.meta?.lineage?.topic}</span>
        </div>
        <div className="mt-4 text-slate-400 font-medium text-xs">
          Examined on {data.meta?.lineage?.topic} - {data.meta?.totalQuestions || 10} questions
        </div>
      </div>
      
      <div className="h-60" /> {/* Spacer for the centered block */}
    </div>
  );
}

function BehaviourAnalysis({ data }: { data: StudentInsightData }) {
  const { timePattern, stableCount, logicCount, errorCount } = data.behaviour;
  
  const getPatternText = () => {
    switch (timePattern) {
      case 'fast_and_correct':
        return `You answered ${stableCount} questions correctly and quickly. These concepts are fully locked in. High automaticity confirmed across ${data.meta?.lineage?.topic}.`;
      case 'fast_and_wrong':
        return `You answered ${errorCount} questions incorrectly while moving fast - this is an impulsive pattern. Slow down by at least 20 seconds when you feel uncertain. Speed is reducing your score, not helping it.`;
      case 'slow_but_correct':
        return `You are reasoning carefully and getting answers right. Strong logic processing confirmed. Next goal: build retrieval speed through repeated timed practice.`;
      case 'slow_and_wrong':
        return `You spent time on questions but still got them wrong. This is a genuine knowledge gap - not a speed issue. Understand the concept fully before attempting more questions.`;
      default:
        return "Establishing behavioural baseline...";
    }
  };

  return (
    <div>
      <p className="text-slate-300 text-lg leading-relaxed font-medium mb-10 max-w-3xl border-l-4 border-indigo-600 pl-6">
        {getPatternText()}
      </p>

      <div className="flex gap-4">
        <MetricChip label="STABLE" value={stableCount} color="indigo" />
        <MetricChip label="LOGIC" value={logicCount} color="amber" />
        <MetricChip label="ERROR" value={errorCount} color="rose" />
      </div>
    </div>
  );
}

function MetricChip({ label, value, color }: { label: string; value: number; color: 'indigo' | 'amber' | 'rose' }) {
  const colors = {
    indigo: 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20',
    amber: 'bg-amber-600/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-600/10 text-rose-400 border-rose-500/20'
  };

  return (
    <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border ${colors[color]} min-w-[180px]`}>
      <span className="text-3xl font-black">{value}</span>
      <span className="text-[10px] font-black tracking-[0.2em]">{label}</span>
    </div>
  );
}

function KnowledgeGapAnalysis({ data }: { data: StudentInsightData }) {
  const { l1, l2, l3 } = data.knowledgeGap;
  const isSingleSubject = l1.length <= 1;
  const isSingleTopic = l2.length <= 1;
  const criticalGap = l3[0];

  return (
    <div className="grid grid-cols-1 gap-6">
      <GapLevel
        label="LEVEL 1 - SUBJECT VIEW"
        text={isSingleSubject 
          ? `Only one subject assessed: ${data.meta?.lineage?.subject}. Drilling deeper for precise gap location.`
          : `Your weakest subject is ${l1[0]?.subject} at ${Math.round(l1[0]?.accuracyPct)}% accuracy compared to ${l1[l1.length - 1]?.subject} at ${Math.round(l1[l1.length - 1]?.accuracyPct)}%.`
        }
      />
      
      <GapLevel
        label="LEVEL 2 - TOPIC VIEW"
        text={isSingleTopic
          ? `Only one topic assessed: ${data.meta?.lineage?.topic}. Gap analysis focused at subtopic level.`
          : `Within ${data.meta?.lineage?.subject}, your weakest topic is ${l2[0]?.topic} at ${Math.round(l2[0]?.accuracyPct)}% accuracy.`
        }
      />

      <GapLevel
        label="LEVEL 3 - CRITICAL GAP"
        highlight
        text={criticalGap
          ? `Specifically: ${criticalGap.dimension} at subtopic level - current accuracy ${Math.round(criticalGap.currentValue)}%. Target: reach 60% before moving forward.`
          : "No critical gaps detected. Knowledge is well-distributed. Push into Expert-level extensions to challenge mastery further."
        }
      />
    </div>
  );
}

function GapLevel({ label, text, highlight = false }: { label: string; text: string; highlight?: boolean }) {
  return (
    <div className={`p-8 rounded-3xl border transition-all ${highlight ? 'bg-indigo-600/5 border-indigo-500/30' : 'bg-slate-900/40 border-white/5'}`}>
      <div className="text-[10px] font-black tracking-[0.3em] text-slate-500 mb-2 uppercase">{label}</div>
      <p className={`font-bold italic ${highlight ? 'text-white text-xl' : 'text-slate-300 text-lg'}`}>{text}</p>
    </div>
  );
}

function SkillProfile({ data }: { data: StudentInsightData }) {
  return (
    <div className="space-y-4">
      {data.skills.profile.map((skill, idx) => (
        <div key={idx} className="flex items-center gap-6">
          <div className="w-[200px] text-xs font-black text-slate-400 uppercase tracking-widest truncate">{skill.skillName}</div>
          <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full transition-all duration-1000" 
              style={{ 
                width: `${skill.accuracyPct}%`,
                backgroundColor: skill.accuracyPct >= 80 ? '#6366f1' : skill.accuracyPct >= 50 ? '#f59e0b' : '#f43f5e'
              }} 
            />
          </div>
          <div className="w-12 text-right text-xs font-black text-white">{Math.round(skill.accuracyPct)}%</div>
        </div>
      ))}
    </div>
  );
}

function SkillsByTopic({ data }: { data: StudentInsightData }) {
  const { byTopic } = data.skills;
  const topics = Array.from(new Set(byTopic.map(s => s.topic)));

  if (topics.length <= 1) {
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
        <p className="text-slate-400 font-bold italic mb-6">All skills assessed within {data.meta?.lineage?.topic}. See full breakdown above.</p>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5">
              <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Skill</th>
              <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Accuracy</th>
              <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.skills.profile.map((skill, idx) => (
              <tr key={idx} className="group">
                <td className="py-4 text-xs font-bold text-slate-200">{skill.skillName}</td>
                <td className="py-4 text-xs font-black text-right text-white">{Math.round(skill.accuracyPct)}%</td>
                <td className="py-4 text-right">
                   <div className={`inline-block w-2 h-2 rounded-full ${skill.accuracyPct >= 80 ? 'bg-indigo-500' : skill.accuracyPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {topics.map((topicName, idx) => (
        <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
          <div className="text-xs font-black text-white uppercase italic tracking-wider mb-6 border-b border-white/5 pb-2">{topicName}</div>
          <div className="space-y-3">
            {byTopic.filter(s => s.topic === topicName).map((skill, sIdx) => (
              <div key={sIdx}>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                  <span>{skill.skillName}</span>
                  <span>{Math.round(skill.accuracyPct)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full" style={{ 
                    width: `${skill.accuracyPct}%`,
                    backgroundColor: skill.accuracyPct >= 80 ? '#6366f1' : skill.accuracyPct >= 50 ? '#f59e0b' : '#f43f5e'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PrioritySkills({ data }: { data: StudentInsightData }) {
  const top3 = data.skills.top3Weakest;

  return (
    <div className="bg-indigo-600/5 border border-indigo-500/30 rounded-3xl p-10">
      <div className="space-y-6 mb-10">
        <PriorityRow icon="HIGH" name={top3[0]?.skillName} acc={top3[0]?.accuracyPct} label="Needs immediate focus" />
        <PriorityRow icon="MED" name={top3[1]?.skillName} acc={top3[1]?.accuracyPct} label="High growth potential" />
        <PriorityRow icon="POS" name={top3[2]?.skillName} acc={top3[2]?.accuracyPct} label="Maintain and extend" />
      </div>

      <div className="text-center">
        <p className="text-indigo-300 font-black italic text-sm">
          Practice {top3[0]?.skillName} type questions specifically. Not more reading - active problem solving only.
        </p>
      </div>
    </div>
  );
}

function PriorityRow({ icon, name, acc, label }: { icon: string; name: string; acc: number; label: string }) {
  if (!name) return null;
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-4">
      <div className="flex items-center gap-4">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-sm font-black text-white uppercase italic">{name}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
        </div>
      </div>
      <div className="text-xl font-black text-white">{Math.round(acc)}%</div>
    </div>
  );
}

function PrioritySignals({ data }: { data: StudentInsightData }) {
  const priorities = data.priorities.slice(0, 3);
  const getSeverityColor = (s: string) => s === 'HIGH' ? 'rose' : s === 'MEDIUM' ? 'amber' : 'emerald';

  return (
    <div className="grid grid-cols-3 gap-6">
      {[0, 1, 2].map(idx => {
        const p = priorities[idx];
        if (!p) return (
          <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-10 h-10 border-2 border-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-700">OK</div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Continue current performance baseline. No additional gaps detected.</p>
          </div>
        );

        const color = getSeverityColor(p.severity);
        const colorClasses = {
          rose: 'bg-rose-600/10 border-rose-500/20 text-rose-400',
          amber: 'bg-amber-600/10 border-amber-500/20 text-amber-400',
          emerald: 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400'
        }[color];

        return (
          <div key={idx} className={`p-8 rounded-3xl border flex flex-col h-full bg-slate-900/40 border-white/5`}>
            <div className={`self-start px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-6 border ${colorClasses}`}>
              {p.severity}
            </div>
            
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 line-clamp-1">{p.hierarchy}</div>
            <div className="text-sm font-black text-white italic mb-4 flex-1">{p.recommendation}</div>
            
            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current</span>
              <span className="text-sm font-black text-white">{Math.round(p.currentValue)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressHistory({ data }: { data: StudentInsightData }) {
  if (!data.progress || data.progress.length < 2) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-20 text-center">
        <p className="text-slate-400 font-bold italic text-lg max-w-md mx-auto leading-relaxed">
          Your baseline has been established today. Complete your next session on {data.meta?.lineage?.topic} to unlock your progress comparison chart. Every expert started exactly where you are.
        </p>
      </div>
    );
  }

  const rowsBySubtopic = new Map<string, Array<{ subtopic: string | null; topic: string | null; accuracyPct: number | null; sessionIndex: number }>>();
  for (const row of (data.progress ?? [])) {
    const key = row.subtopic || row.topic || 'Unknown';
    const bucket = rowsBySubtopic.get(key) ?? [];
    bucket.push(row);
    rowsBySubtopic.set(key, bucket);
  }

  const rows = Array.from(rowsBySubtopic.entries())
    .map(([subtopic, items]) => {
      const sorted = [...items].sort((a, b) => (a.sessionIndex ?? 0) - (b.sessionIndex ?? 0));
      if (sorted.length < 2) return null;
      const prev = sorted[sorted.length - 2];
      const curr = sorted[sorted.length - 1];
      const change = (curr.accuracyPct ?? 0) - (prev.accuracyPct ?? 0);
      const trend = change > 0 ? 'improving' : change < 0 ? 'regressing' : 'stable';
      return { subtopic, prev, curr, change, trend };
    })
    .filter(Boolean) as Array<{ subtopic: string; prev: { accuracyPct: number | null }; curr: { accuracyPct: number | null }; change: number; trend: string }>;

  if (rows.length == 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-20 text-center">
        <p className="text-slate-400 font-bold italic text-lg max-w-md mx-auto leading-relaxed">
          Your baseline has been established today. Complete your next session on {data.meta?.lineage?.topic} to unlock your progress comparison chart. Every expert started exactly where you are.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-white/5">
            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtopic</th>
            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Prev Session</th>
            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">This Session</th>
            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Change</th>
            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, idx) => (
            <tr key={`${row.subtopic}-${idx}`}>
              <td className="px-8 py-6 text-xs font-bold text-slate-200">{row.subtopic}</td>
              <td className="px-8 py-6 text-xs font-black text-center text-slate-500">{Math.round(row.prev.accuracyPct ?? 0)}%</td>
              <td className="px-8 py-6 text-xs font-black text-center text-white">{Math.round(row.curr.accuracyPct ?? 0)}%</td>
              <td className={`px-8 py-6 text-xs font-black text-center ${row.change > 0 ? 'text-emerald-500' : row.change < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                {row.change > 0 ? '+' : ''}{Math.round(row.change)}
              </td>
              <td className="px-8 py-6 text-center">
                <span className={`text-xl ${row.trend === 'improving' ? 'text-emerald-500' : row.trend === 'regressing' ? 'text-rose-500' : 'text-slate-500'}`}>
                  {row.trend === 'improving' ? '^' : row.trend === 'regressing' ? 'v' : '>'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NextSteps({ data }: { data: StudentInsightData }) {
  const { nextExamHours, score } = data.nextSteps;
  const criticalGap = data.nextSteps.criticalGap;

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Item 1 */}
      <div className="flex gap-6">
        <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-xs font-black tracking-widest shrink-0">TIME</div>
        <div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">When to study next</div>
          <p className="text-sm font-bold text-white leading-relaxed">
            Return in {nextExamHours} hours for your next assessment vector.
          </p>
        </div>
      </div>

      {/* Item 2 */}
      <div className="flex gap-6">
        <div className="w-14 h-14 bg-rose-600/10 rounded-2xl flex items-center justify-center text-xs font-black tracking-widest shrink-0">FOCUS</div>
        <div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">What to focus on</div>
          <p className="text-sm font-bold text-white leading-relaxed">
            Focus area: {criticalGap?.dimension || data.nextSteps.weakestSubtopic || 'General Practice'} at {criticalGap?.hierarchy.split(' > ').pop() || 'Core'} difficulty level.
          </p>
        </div>
      </div>

      {/* Item 3 */}
      <div className="flex gap-6">
        <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-xs font-black tracking-widest shrink-0">BOOST</div>
        <div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Encouragement</div>
          <p className="text-sm font-bold text-white leading-relaxed">
            {score >= 80 
              ? "Expert-Ready status confirmed. Push into advanced vectors." 
              : score >= 60 
                ? "Borderline threshold. One focused session closes the gap."
                : "Foundations need reinforcement. Slow down. Master basics first."
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function Footer({ data, page }: { data: StudentInsightData; page: number }) {
  return (
    <div className="mt-auto pt-10">
      <div className="flex justify-between items-end border-t border-white/5 pt-6">
        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          <div>Neural Diagnostics - Analytical Engine v4.5</div>
          <div className="mt-1">Exam ID: {data.meta?.examId}</div>
        </div>
        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] text-center">
          Generated: {format(new Date(), 'MMMM dd, yyyy')}
        </div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
          STUDENT CONFIDENTIAL - PAGE {page} / 3
        </div>
      </div>
      <p className="mt-4 text-[7px] text-slate-700 font-medium leading-relaxed max-w-2xl">
        This report is personalised to your exam session data and performance patterns. Results reflect a single assessment vector. 
        Analytical engines are assistive in nature and should be used as part of a comprehensive pedagogical strategy.
      </p>
    </div>
  );
}