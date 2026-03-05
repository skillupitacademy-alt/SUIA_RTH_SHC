import { PremiumReport } from "./report.engine";

/**
 * Deterministic Data Analyst Interpreter for Exam Reports.
 * Implements strict, evidence-based narrative generation based on statistical thresholds.
 */
export class ReportInterpreter {
  private static singleton = new ReportInterpreter();
  
  /**
   * Synthesizes the narrative interpretation for a full report.
   */
  interpret(report: PremiumReport) {
    return {
      kpi: this.interpretKPI(report),
      subtopics: this.interpretSubtopics(report),
      skills: this.interpretSkills(report),
      heatmap: this.interpretHeatmap(report),
      difficulty: this.interpretDifficulty(report),
      time: this.interpretTime(report),
      meta: this.interpretMeta(report)
    };
  }

  private interpretKPI(report: PremiumReport): string[] {
    const bullets: string[] = [];
    const { score, mastery, readiness, confidence, percentile } = report;

    // 1. Overall Score Assessment
    let band = "CRITICAL";
    if (score >= 85) band = "MASTERY";
    else if (score >= 70) band = "ADVANCING";
    else if (score >= 60) band = "WEAK";

    bullets.push(`Composite Accuracy: ${score}% falls into the ${band} band.`);

    // 2. Mastery Comparison
    const masteryBand = mastery >= 85 ? "MASTERY" : (mastery >= 70 ? "ADVANCING" : "STRESSED");
    bullets.push(`Weighted Mastery: ${mastery}% indicates a ${masteryBand.toLowerCase()} grasp of the overall subject blueprint.`);

    // 3. Readiness Synthesis
    let readinessState = "NOT_READY";
    if (readiness >= 75) readinessState = "READY";
    else if (readiness >= 60) readinessState = "BORDERLINE";

    bullets.push(`Readiness Index: ${readiness}% synthesized — Status: ${readinessState.replace('_', ' ')} for next-level certification.`);

    // 4. Percentile context
    bullets.push(`Cohort Standing: You are performing at the ${percentile}${this.getOrdinalSuffix(percentile)} percentile of recent participants.`);

    // 5. Confidence Guard
    if (confidence === 'LOW') {
      bullets.push("Confidence Warning: Conclusions are tentative due to limited sample volume or high variance.");
    }

    return bullets;
  }

  private interpretSubtopics(report: PremiumReport): string[] {
    const bullets: string[] = [];
    const significant = report.subtopics.filter(s => s.attempts >= 3);

    if (significant.length === 0) {
      return ["No subtopic-level diagnostics available with sufficient data volume (>=3 attempts)."];
    }

    const weak = significant.filter(s => s.accuracy < 70);
    const strong = significant.filter(s => s.accuracy >= 85);

    if (weak.length > 0) {
      bullets.push(`Critical Vectors: ${weak.map(s => `${s.name} (${s.accuracy}%)`).join(', ')} require immediate remediation.`);
    }

    if (strong.length > 0) {
      bullets.push(`Established Vectors: ${strong.map(s => `${s.name} (${s.accuracy}%)`).join(', ')} show high stability.`);
    }

    if (bullets.length === 0) {
      bullets.push("Subtopic performance remains in the stable mid-range; no outliers detected.");
    }

    return bullets;
  }

  private interpretSkills(report: PremiumReport): string[] {
    const bullets: string[] = [];
    const significant = report.skills.filter(s => s.attempts >= 3);

    if (significant.length === 0) {
      return ["Neural Skill Mapping: Insufficient data to judge specific cognitive skill masteries."];
    }

    const weak = significant.sort((a, b) => a.accuracy - b.accuracy).slice(0, 2).filter(s => s.accuracy < 70);
    const top = significant.sort((a, b) => b.accuracy - a.accuracy).slice(0, 1).filter(s => s.accuracy >= 85);

    if (weak.length > 0) {
      bullets.push(`Friction Points: ${weak.map(s => `${s.name} (${s.accuracy}%)`).join(' and ')} are active performance bottlenecks.`);
    }

    if (top.length > 0) {
      bullets.push(`Peak Strength: ${top[0].name} (${top[0].accuracy}%) is your strongest cognitive anchor.`);
    }

    return bullets;
  }

  private interpretHeatmap(report: PremiumReport): string[] {
    const bullets: string[] = [];
    const cells = report.heatmap;

    // Highlight Expert Gaps
    const expertGaps = cells.filter(h => {
      const acc = Number(h.accuracy ?? 0);
      return h.difficulty === 'expert' && (h.attempts ?? 0) >= 3 && acc < 70;
    });
    if (expertGaps.length > 0) {
      bullets.push(`Depth Gaps: ${expertGaps.map(h => `${h.subtopic} (${h.accuracy}%)`).join(', ')} collapse under expert-level complexity.`);
    }

    // Highlight drop-offs
    const subtopicsInHeatmap = [...new Set(cells.map(h => h.subtopic))];
    subtopicsInHeatmap.forEach(st => {
      const inter = cells.find(h => h.subtopic === st && h.difficulty === 'intermediate');
      const expert = cells.find(h => h.subtopic === st && h.difficulty === 'expert');

      if (inter && expert && (inter.attempts ?? 0) >= 3 && (expert.attempts ?? 0) >= 3) {
        const interAcc = Number(inter.accuracy ?? 0);
        const expertAcc = Number(expert.accuracy ?? 0);
        const dropArr = interAcc - expertAcc;
        if (dropArr > 20) {
          bullets.push(`Rigidity Alert: ${st} accuracy drops ${dropArr} points when moving from Intermediate to Expert.`);
        }
      }
    });

    const lowData = cells.filter(h => h.attempts < 3);
    if (lowData.length > cells.length / 2) {
      bullets.push("Matrix Saturation: Multiple cells lack attempts; data density is low for depth analysis.");
    }

    if (bullets.length === 0) bullets.push("Knowledge Matrix: Balanced performance across difficulty levels with existing data.");

    return bullets;
  }

  private interpretDifficulty(report: PremiumReport): string[] {
    const bullets: string[] = [];
    const data = report.difficulty ?? [];

    const getLevel = (l: string) => data.find(d => d.level.toLowerCase().includes(l));
    const inter = getLevel('inter');
    const expert = getLevel('expert');
    const simple = getLevel('simple');

    if (simple && (simple.attempts ?? 0) >= 3) bullets.push(`Foundations: ${simple.accuracy ?? 0}% accuracy on simple items.`);
    if (inter && (inter.attempts ?? 0) >= 3) bullets.push(`Logic Base: ${inter.accuracy ?? 0}% accuracy on intermediate items.`);
    if (expert && (expert.attempts ?? 0) >= 3) {
      const expAcc = Number(expert.accuracy ?? 0);
      const state = expAcc >= 65 ? "Stable" : "Unstable";
      bullets.push(`Expert Load: ${expAcc}% accuracy — Status: ${state}.`);
    }

    // Drop-off
    if (inter && expert && (inter.attempts ?? 0) >= 3 && (expert.attempts ?? 0) >= 3) {
      const drop = Number(inter.accuracy ?? 0) - Number(expert.accuracy ?? 0);
      if (drop > 15) {
        bullets.push(`Complexity Friction: Significant ${drop}-point drop detected at the expert transition.`);
      }
    }

    return bullets;
  }

  private interpretTime(report: PremiumReport): string[] {
    const bullets: string[] = [];
    const { stable, logic, neural } = report.timeBuckets;
    const total = stable + logic + neural;

    if (total === 0) return ["No temporal data recorded for this session."];

    const stablePct = (stable / total) * 100;
    const logicPct = (logic / total) * 100;
    const neuralPct = (neural / total) * 100;

    // Time-based behavior flags
    // neuralPct represents "wrong" in this context
    if (neuralPct > 30) {
      bullets.push(`Temporal Profile: High error density (${Math.round(neuralPct)}%) indicates significant active confusion.`);
    }

    // Fluency (logic vs stable)
    if (logicPct > 40 && stablePct < 30) {
      bullets.push("Fluency Alert: High Logic-phase volume (40%+) relative to Stable hits indicates low recall fluency.");
    }

    if (stablePct > 60) {
      bullets.push("Direct Recall: High Stable-phase hits suggest strong cognitive automation for these items.");
    }

    bullets.push(`Total temporal spend: ${report.totalTimeSpentSeconds}s across ${total} vectors.`);

    return bullets;
  }

  private interpretMeta(report: PremiumReport): string[] {
    const notes: string[] = [];

    if (report.expertDropOff && report.score >= 80) {
      notes.push("Strategic Misalignment: Exceptional overall score but significant fragility in Expert-level constructs.");
    }

    if (report.confidence === 'LOW') {
      notes.push("Analytical Limit: Low assessment volume makes this profile a statistical 'snapshot' rather than a trend.");
    }

    if (report.readiness < 60 && report.score > 70) {
      notes.push("Readiness Gap: High raw score but lacking the mastery consistency required for certification.");
    }

    return notes;
  }

  private getOrdinalSuffix(i: number): string {
    const j = i % 10, k = i % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  }

  // Static facades for legacy tests
  static interpret(report: PremiumReport) { return this.singleton.interpret(report); }
  static interpretKPI(report: PremiumReport) { return this.singleton.interpretKPI(report); }
  static interpretSubtopics(report: PremiumReport) { return this.singleton.interpretSubtopics(report); }
  static interpretSkills(report: PremiumReport) { return this.singleton.interpretSkills(report); }
  static interpretHeatmap(report: PremiumReport) { return this.singleton.interpretHeatmap(report); }
  static interpretDifficulty(report: PremiumReport) { return this.singleton.interpretDifficulty(report); }
  static interpretTime(report: PremiumReport) { return this.singleton.interpretTime(report); }
  static interpretMeta(report: PremiumReport) { return this.singleton.interpretMeta(report); }
}
