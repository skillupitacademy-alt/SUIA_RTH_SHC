import React from "react";
import { motion } from "framer-motion";
import { Clock, Target, Zap, RefreshCw, AlertTriangle, ArrowUp, ArrowDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GuidanceSignalRow, HistoricalProgressRow, AggregationRow } from "@/hooks/useInsightVectorData";
import { ExamReport } from "./ExamReportLayout";
import { PrecisionGuidanceCard } from "./PrecisionGuidanceCard";
import { ZLoader } from "@quiz/ui";

interface InsightVectorTabProps {
  guidanceSignals: GuidanceSignalRow[];
  historicalProgress: HistoricalProgressRow[];
  skillData: AggregationRow[];
  report: ExamReport;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const InsightVectorTab: React.FC<InsightVectorTabProps> = ({
  guidanceSignals,
  historicalProgress,
  skillData,
  report,
  loading,
  error,
  onRetry
}) => {
  if (error) {
    return (
      <div className="p-12 rounded-[3rem] bg-slate-900/40 border border-rose-500/20 flex flex-col items-center justify-center text-center space-y-6">
        <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Vector Sync Failed</h3>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 max-w-xs mx-auto">
            Unable to load guidance signals. Refresh the page to retry.
          </p>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all active:scale-95 text-[11px]"
        >
          <RefreshCw size={14} />
          Sync Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 rounded-[3rem] bg-slate-900/40 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 min-h-[420px]">
        <ZLoader />
        <div className="space-y-3 max-w-xl">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">
            Analytics is loading
          </h3>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] max-w-md mx-auto leading-relaxed">
            Preparing precision guidance and insight vectors. This can take a moment while your export artifact is reconciled.
          </p>
        </div>
      </div>
    );
  }

  const sortedSignals = [...guidanceSignals].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  const normalizedSkills = skillData
    .filter((s) => typeof s.skillName === "string" && s.skillName.trim() !== "")
    .map((s) => ({ name: s.skillName as string, accuracy: Math.round(s.accuracyPct) }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const weakestSkills = normalizedSkills.slice(0, 3);
  const priorityLabels = ["needs focus", "growth zone", "near mastery"];

  const sessionIndices = Array.from(new Set(historicalProgress.map((h) => h.sessionIndex))).sort((a, b) => a - b);
  const subtopicRows = buildSubtopicTable(historicalProgress, sessionIndices);

  const nextExamHours = report.score >= 80 ? 72 : report.score >= 60 ? 48 : 24;
  const weakestSubtopic = report.ai?.weakest_subtopic || "Core Concepts";
  const weakestDifficulty = report.weakest_difficulty || "Intermediate";
  const methodText = report.score >= 80
    ? "Active recall practice. Expert-level question sets only."
    : report.score >= 60
      ? "Mixed difficulty practice. Timed sessions of 15 minutes."
      : "Concept review first. Then Simple → Intermediate progression.";

  return (
    <div className="space-y-16 pt-6 animate-in fade-in duration-700">
      {/* SECTION 1 — SIGNAL COMMAND CENTRE */}
      <section className="space-y-8">
        <div>
          <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Signal Command Centre</h4>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.25em]">All guidance signals ranked by priority</p>
        </div>

        <div className="space-y-6">
          {sortedSignals.length > 0 ? (
            sortedSignals.map((signal, idx) => (
              <PrecisionGuidanceCard
                key={`${signal.signalType}-${idx}`}
                signal={signal}
                size="large"
                showProgress
                showTrend
              />
            ))
          ) : (
            <div className="p-12 bg-slate-900/40 rounded-[2.5rem] border border-white/5 border-dashed border-2 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-600 uppercase tracking-tighter">Awaiting Data Vector</span>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">
                Complete additional assessment sessions to generate precision guidance signals.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2 — SKILL INTELLIGENCE MATRIX */}
      <section className="space-y-8">
        <div>
          <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Skill Intelligence Matrix</h4>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.25em]">Cognitive skill performance breakdown</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 space-y-6">
            <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">All Skills (Weakest First)</h5>
            <div className="space-y-6">
              {normalizedSkills.map((skill, idx) => (
                <div key={`${skill.name}-${idx}`} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">{skill.name}</span>
                    <span className={cn("text-[13px] font-black", getAccuracyTextColor(skill.accuracy))}>{skill.accuracy}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.accuracy}%` }}
                      transition={{ duration: 1, delay: idx * 0.05 }}
                      className={cn("h-full rounded-full", getAccuracyBarColor(skill.accuracy))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 flex flex-col justify-between">
            <div>
              <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">Priority Skills</h5>
              <div className="space-y-4">
                {weakestSkills.map((skill, idx) => (
                  <div key={`${skill.name}-priority-${idx}`} className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-3 w-3 rounded-full", idx === 0 ? "bg-rose-500" : idx === 1 ? "bg-amber-500" : "bg-emerald-500")} />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-slate-200 uppercase tracking-widest">{idx + 1}. {skill.name}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{priorityLabels[idx] ?? "priority"}</span>
                      </div>
                    </div>
                    <span className={cn("text-[12px] font-black", getAccuracyTextColor(skill.accuracy))}>{skill.accuracy}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 font-medium leading-relaxed italic">
              Practise {weakestSkills[0]?.name ?? "priority"} type questions. Not reading — active problem solving.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — PROGRESSION TIMELINE */}
      <section className="space-y-8">
        <div>
          <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Progression Timeline</h4>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.25em]">Your learning trajectory across sessions</p>
        </div>

        {historicalProgress.length > 0 ? (
          <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-x-auto scrollbar-hide">
            <table className="min-w-[720px] w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="pb-4">Subtopic</th>
                  {sessionIndices.map((s) => (
                    <th key={s} className="pb-4 text-center">S{s}</th>
                  ))}
                  <th className="pb-4 text-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {subtopicRows.map((row) => (
                  <tr key={row.subtopic} className="border-b border-white/5">
                    <td className="py-4 text-[12px] font-bold text-slate-200 uppercase tracking-wider">{row.subtopic}</td>
                    {sessionIndices.map((s) => (
                      <td key={s} className="py-4 text-center text-[12px] font-black text-slate-300">
                        {row.values[s] !== undefined ? `${row.values[s]}%` : "—"}
                      </td>
                    ))}
                    <td className="py-4 text-center">
                      {row.trend === "improving" ? (
                        <ArrowUp className="h-4 w-4 text-emerald-500 inline-block" />
                      ) : row.trend === "regressing" ? (
                        <ArrowDown className="h-4 w-4 text-rose-500 inline-block" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-slate-500 inline-block" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 bg-slate-900/40 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em]">Baseline Established</span>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.25em] mt-3 max-w-lg">
              Your first session data has been recorded. Complete your next assessment on this topic to unlock your progression timeline. Tracking begins after session 2.
            </p>
          </div>
        )}
      </section>

      {/* SECTION 4 — NEXT ACTION PROTOCOL */}
      <section className="space-y-8">
        <div>
          <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Next Action Protocol</h4>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.25em]">Your personalised study directive</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <Clock size={22} />
            </div>
            <h5 className="text-[13px] font-black text-white uppercase tracking-widest mb-4">Next Session</h5>
            <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
              Return in {nextExamHours} hours for optimal neural consolidation.
            </p>
          </div>

          <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
              <Target size={22} />
            </div>
            <h5 className="text-[13px] font-black text-white uppercase tracking-widest mb-4">Focus Vector</h5>
            <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
              {weakestSubtopic} at {weakestDifficulty} difficulty. Target: 60% accuracy minimum.
            </p>
          </div>

          <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <Zap size={22} />
            </div>
            <h5 className="text-[13px] font-black text-white uppercase tracking-widest mb-4">Method</h5>
            <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
              {methodText}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — DIAGNOSTIC FOOTER */}
      <div className="mt-10 pt-8 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
          <span>INSIGHT VECTOR v1.0</span>
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
            Signals derived from examination vectors. Updated after each assessment session.
          </span>
          <span className="text-[10px] font-black text-slate-700">SYS_{report.examId?.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

function severityRank(severity: GuidanceSignalRow["severity"]) {
  if (severity === "HIGH") return 0;
  if (severity === "MEDIUM") return 1;
  return 2;
}

function getAccuracyBarColor(value: number) {
  if (value >= 80) return "bg-indigo-500";
  if (value >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function getAccuracyTextColor(value: number) {
  if (value >= 80) return "text-indigo-400";
  if (value >= 50) return "text-amber-400";
  return "text-rose-400";
}

function buildSubtopicTable(rows: HistoricalProgressRow[], sessionIndices: number[]) {
  const map = new Map<string, { subtopic: string; values: Record<number, number>; trend: HistoricalProgressRow["trend"] }>();
  rows.forEach((r) => {
    const key = r.subtopic || "General";
    if (!map.has(key)) {
      map.set(key, { subtopic: key, values: {}, trend: r.trend });
    }
    const entry = map.get(key)!;
    entry.values[r.sessionIndex] = Math.round(r.accuracyPct);
    entry.trend = r.trend;
  });

  const ordered = Array.from(map.values());
  ordered.sort((a, b) => a.subtopic.localeCompare(b.subtopic));

  // Ensure missing indices exist for consistent rendering
  ordered.forEach((row) => {
    sessionIndices.forEach((s) => {
      if (row.values[s] === undefined) row.values[s] = undefined as unknown as number;
    });
  });

  return ordered;
}
