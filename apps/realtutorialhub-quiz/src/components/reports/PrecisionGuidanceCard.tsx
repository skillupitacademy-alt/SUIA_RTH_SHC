import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { GuidanceSignalRow } from "@/hooks/useInsightVectorData";

interface PrecisionGuidanceCardProps {
  signal: GuidanceSignalRow;
  showProgress?: boolean;
  showTrend?: boolean;
  size?: "normal" | "large";
}

export const PrecisionGuidanceCard: React.FC<PrecisionGuidanceCardProps> = ({
  signal,
  showProgress = false,
  showTrend = false,
  size = "normal"
}) => {
  const severityColor = getSeverityColor(signal.severity);
  const labelColor = getSignalLabelColor(signal.signalType, signal.severity);
  const accuracy = Math.round(signal.currentValue ?? 0);
  const difficulty = extractDifficulty(signal.dimension);
  const accuracyColor = getAccuracyColor(accuracy);

  return (
    <div className={cn(
      "bg-slate-900/40 border border-white/5 rounded-[2rem] relative overflow-hidden group hover:bg-slate-900/60 transition-all duration-300",
      size === "large" ? "p-8" : "p-6"
    )}>
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="flex items-center gap-3">
          <span className={cn("px-2.5 py-1 rounded text-[10px] font-black text-white uppercase tracking-tighter", severityColor.badge)}>
            {signal.severity}
          </span>
          <span className={cn("text-[13px] font-black uppercase tracking-widest", labelColor)}>
            {signal.signalType}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-[11px] font-bold text-indigo-300/80 uppercase tracking-[0.2em]">
          {signal.hierarchy}
        </div>

        <ul className="space-y-2">
          <li className="text-[13px] text-slate-300 font-medium leading-relaxed">
            {signal.recommendation}
          </li>
          <li className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
            Current accuracy: {accuracy}%
          </li>
        </ul>

        {difficulty && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-lg border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-300">
            {difficulty}
          </div>
        )}

        {showProgress && (
          <div className="pt-2 space-y-2">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Current Status</div>
            <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden p-[1px] border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${accuracy}%` }}
                transition={{ duration: 1.2, ease: "circOut" }}
                className={cn("h-full rounded-full", accuracyColor)}
              />
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{accuracy}% accuracy</div>
          </div>
        )}

        {showTrend && signal.historicalTrend && signal.historicalTrend.length >= 2 && (
          <div className="pt-2">
            <SignalSparkline values={signal.historicalTrend.map((t) => t.value)} />
          </div>
        )}
      </div>
    </div>
  );
};

function getSeverityColor(severity: GuidanceSignalRow["severity"]) {
  if (severity === "HIGH") return { badge: "bg-rose-500", progress: "bg-rose-500" };
  if (severity === "MEDIUM") return { badge: "bg-amber-500", progress: "bg-amber-500" };
  return { badge: "bg-emerald-500", progress: "bg-emerald-500" };
}

function getSignalLabelColor(signalType: string, severity: GuidanceSignalRow["severity"]) {
  const label = signalType.toLowerCase();
  if (label.includes("critical") || label.includes("regression")) return "text-rose-400";
  if (label.includes("skill") || label.includes("anomaly")) return "text-amber-400";
  if (label.includes("strength")) return "text-emerald-400";
  return severity === "HIGH" ? "text-rose-400" : severity === "MEDIUM" ? "text-amber-400" : "text-emerald-400";
}

function getAccuracyColor(value: number) {
  if (value >= 80) return "bg-indigo-500";
  if (value >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function extractDifficulty(dimension: string | undefined) {
  if (!dimension) return null;
  const match = dimension.match(/\(([^)]+)\)/);
  if (match && match[1]) return match[1].toUpperCase();
  const lowered = dimension.toLowerCase();
  if (lowered.includes("expert")) return "EXPERT";
  if (lowered.includes("intermediate")) return "INTERMEDIATE";
  if (lowered.includes("simple")) return "SIMPLE";
  return null;
}

function SignalSparkline({ values }: { values: number[] }) {
  const width = 140;
  const height = 36;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return { x, y };
  });

  const trend = values[values.length - 1] - values[0];
  const stroke = trend > 1 ? "stroke-emerald-400" : trend < -1 ? "stroke-rose-400" : "stroke-slate-500";

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg width={width} height={height} className="block">
      <path d={path} className={cn("fill-none stroke-[2]", stroke)} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} className={cn("fill-current", stroke.replace("stroke-", "text-"))} />
      ))}
    </svg>
  );
}
