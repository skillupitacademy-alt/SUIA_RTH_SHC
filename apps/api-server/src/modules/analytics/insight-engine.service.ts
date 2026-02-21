
export interface InsightSignal {
  type: 'good' | 'neutral' | 'risk';
  text: string;
}

export interface DynamicInsight {
  title: string;
  measures: string;
  matters: string;
  howToRead: string;
  signals: InsightSignal[];
  nextSteps: string[];
  confidence: 'low' | 'medium' | 'high';
  sampleSize: number;
  expectedOutcome: string;
}

export class InsightEngineService {
  /**
   * Generates a dynamic interpretation of the Performance Trend (Score History)
   */
  static analyzePerformanceTrend(
    userName: string,
    data: { dates: string[]; scores: number[] }
  ): DynamicInsight {
    const { scores, dates } = data;
    const sampleSize = scores.length;
    
    // 1. Calculate Confidence
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (sampleSize >= 8) confidence = 'high';
    else if (sampleSize >= 4) confidence = 'medium';

    // 2. Perform Analysis (The Math)
    const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const latestScore = scores[scores.length - 1] ?? 0;
    const zeroCount = scores.filter(s => s === 0).length;
    
    // Variance check
    const variance = scores.length > 1 
      ? Math.sqrt(scores.reduce((sq, n) => sq + Math.pow(n - average, 2), 0) / (scores.length - 1))
      : 0;

    const signals: InsightSignal[] = [];
    const nextSteps: string[] = [];

    // 3. Generate Logic-Driven Signals
    if (latestScore >= 80) {
      signals.push({ type: 'good', text: `${userName}, your latest score of ${latestScore}% reflects high tactical execution.` });
    }

    if (variance > 25) {
      signals.push({ type: 'neutral', text: `High Volatility detected. Your scores vary by ~${Math.round(variance)}%, suggesting inconsistent preparation.` });
    }

    if (zeroCount >= 2) {
      signals.push({ type: 'risk', text: `Critical: ${zeroCount} abandoned sessions (0%) detected. This severely impacts your reliability profile.` });
    }

    if (scores.length >= 2 && latestScore < scores[scores.length - 2]) {
      signals.push({ type: 'risk', text: `Performance dip detected since your last session on ${dates[dates.length - 2]}.` });
    } else if (scores.length >= 2 && latestScore > scores[scores.length - 2]) {
      signals.push({ type: 'good', text: `Positive momentum! You recovered from ${scores[scores.length - 2]}% to ${latestScore}% today.` });
    }

    // 4. Generate Prescriptive Next Steps
    if (zeroCount > 0) {
      nextSteps.push("Minimize abandoned sessions to improve data integrity.");
    }
    if (variance > 20) {
      nextSteps.push("Stick to one topic until you achieve three consecutive scores above 70%.");
    } else {
      nextSteps.push("Maintain current study rhythm; your consistency is your strength.");
    }
    nextSteps.push(latestScore < 50 ? "Review foundational concepts before attempting another exam." : "Challenge yourself with a higher difficulty tier.");

    return {
      title: `${userName}'s Performance Report`,
      measures: "The reliability of your exam outcomes over time.",
      matters: "Determines if you are ready for high-stakes certification or live projects.",
      howToRead: "Stable high lines indicate mastery. Wide zig-zags indicate guessing or gaps.",
      signals,
      nextSteps: nextSteps.slice(0, 3),
      confidence,
      sampleSize,
      expectedOutcome: variance > 20 
        ? "Expect a 15% reduction in score variance if you finish every session started."
        : "Expect stabilization at your peak performance level within 5 more sessions."
    };
  }

  /**
   * Generates a dynamic interpretation of the Mastery Trend (Daily Accuracy)
   */
  static analyzeMasteryTrend(
    userName: string,
    data: { dates: string[]; accuracy: number[] },
    performanceData?: { scores: number[] }
  ): DynamicInsight {
    const { accuracy } = data;
    const sampleSize = accuracy.length;
    
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (sampleSize >= 5) confidence = 'high';
    else if (sampleSize >= 3) confidence = 'medium';

    const latestAccuracy = accuracy[accuracy.length - 1] ?? 0;
    const prevAccuracy = accuracy[accuracy.length - 2] ?? 0;
    const averageAccuracy = accuracy.length > 0 ? accuracy.reduce((a, b) => a + b, 0) / accuracy.length : 0;

    const signals: InsightSignal[] = [];
    const nextSteps: string[] = [];

    // 1. Accuracy vs Score Divergence (The Secret Sauce)
    if (performanceData && performanceData.scores.length > 0) {
      const latestScore = performanceData.scores[performanceData.scores.length - 1];
      if (latestScore > 80 && latestAccuracy < 50) {
        signals.push({ type: 'risk', text: `${userName}, we detected a 'Memorization Gap'. Your scores are high, but your underlying accuracy (${latestAccuracy}%) is lagging behind.` });
      } else if (latestScore < 50 && latestAccuracy > 70) {
        signals.push({ type: 'neutral', text: "High Potential: You understand the concepts (Accuracy is high), but your test scores are suffering from time-management or focus." });
      }
    }

    // 2. Growth Analysis
    if (latestAccuracy > prevAccuracy && prevAccuracy > 0) {
      signals.push({ type: 'good', text: `Neural growth active! Your daily average accuracy rose by ${latestAccuracy - prevAccuracy}% since your last session.` });
    } else if (latestAccuracy < prevAccuracy) {
      signals.push({ type: 'risk', text: `Significant accuracy decay noticed. You dropped from ${prevAccuracy}% to ${latestAccuracy}% accuracy.` });
    }

    if (Math.abs(latestAccuracy - averageAccuracy) < 3 && sampleSize > 3) {
      signals.push({ type: 'neutral', text: "Stagnation Warning: Your accuracy is plateauing. It's time to shift to more complex sub-folders." });
    }

    // 3. Prescriptions
    if (latestAccuracy < 40) {
      nextSteps.push("Stop active testing. Switch to 'Review Mode' for the next 48 hours.");
    }
    if (latestAccuracy > 80) {
      nextSteps.push("You are ready for Expert-level simulations. Standard quizzes are no longer challenging you.");
    } else {
      nextSteps.push("Focus on Dimension-based errors (Topic vs Skill) to break the accuracy floor.");
    }
    nextSteps.push("Review questions where you spent more than 45 seconds but still got it wrong.");

    return {
      title: `${userName}'s Strategic Mastery`,
      measures: "Your internal knowledge density across all attempted dimensions.",
      matters: "Measures permanent learning versus temporary test-taking skill.",
      howToRead: "A rising line represents permanent skill acquisition. Flat lines represent a plateau.",
      signals,
      nextSteps: nextSteps.slice(0, 3),
      confidence,
      sampleSize,
      expectedOutcome: latestAccuracy > averageAccuracy
        ? "Expect a new 'Knowledge Baseline' to be established if you maintain this accuracy for 2 more days."
        : "Expect foundational stabilization if questions from today's session are re-reviewed immediately."
    };
  }
}
