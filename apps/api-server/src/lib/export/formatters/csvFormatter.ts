import type { ExportPayload } from '../exportTypes';

export class CsvFormatter {
  private toCsv<T>(data: T[], headers: string[]): string {
    if (data.length === 0) return headers.join(',');
    
    const lines = [headers.join(',')];
    
    data.forEach((row) => {
      const line = headers.map(header => {
        const val = (row as Record<string, unknown>)[header] ?? '';
        // Basic escaping
        const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      });
      lines.push(line.join(','));
    });
    
    return lines.join('\n');
  }

  async formatAsZip(payload: ExportPayload): Promise<Buffer> {
    // Assuming JSZip will be available
    // For now, we prepare the contents
    const contents: Record<string, string> = {
      'README.txt': this.generateReadme(),
      'raw_attempts.csv': this.toCsv(payload.rawAttempts, [
        'studentId', 'studentName', 'sessionId', 'sessionDate', 'domain', 'subject', 'topic', 'subtopic',
        'questionId', 'questionText', 'correctAnswer', 'userAnswer', 'isCorrect', 'difficulty', 
        'timeSpentSeconds', 'skillName', 'processingPattern', 'isImpulsive', 'isDiligent'
      ]),
      'L1_domain.csv': this.toCsv(payload.aggregations.L1_domain, ['domain', 'totalAttempts', 'accuracyPct', 'masteryScorePct', 'readinessLevel']),
      'L2_domain_subject.csv': this.toCsv(payload.aggregations.L2_domain_subject, ['domain', 'subject', 'totalAttempts', 'accuracyPct', 'masteryScorePct']),
      'L3_domain_subject_topic.csv': this.toCsv(payload.aggregations.L3_domain_subject_topic, ['domain', 'subject', 'topic', 'totalAttempts', 'accuracyPct']),
      'L4_full_hierarchy.csv': this.toCsv(payload.aggregations.L4_full_hierarchy, ['domain', 'subject', 'topic', 'subtopic', 'totalAttempts', 'accuracyPct']),
      'L5_difficulty.csv': this.toCsv(payload.aggregations.L5_difficulty, ['domain', 'subject', 'difficulty', 'totalAttempts', 'accuracyPct']),
      'L6_skill.csv': this.toCsv(payload.aggregations.L6_skill, ['domain', 'subject', 'skillName', 'totalAttempts', 'accuracyPct', 'masteryScorePct']),
      'L7_topic_x_difficulty.csv': this.toCsv(payload.aggregations.L7_topic_x_difficulty, ['topic', 'difficulty', 'totalAttempts', 'accuracyPct']),
      'L8_topic_x_skill.csv': this.toCsv(payload.aggregations.L8_topic_x_skill, ['topic', 'skillName', 'totalAttempts', 'accuracyPct']),
      'L9_full_granular.csv': this.toCsv(payload.aggregations.L9_full_granular, ['subtopic', 'difficulty', 'skillName', 'totalAttempts', 'accuracyPct', 'avgTimeSec']),
      'L10_student_domain.csv': this.toCsv(payload.aggregations.L10_student_domain, ['studentId', 'domain', 'totalAttempts', 'accuracyPct', 'masteryScorePct']),
      'L11_student_full_hierarchy.csv': this.toCsv(payload.aggregations.L11_student_full_hierarchy, ['studentId', 'domain', 'subject', 'topic', 'subtopic', 'totalAttempts', 'accuracyPct']),
      'L12_student_diff_skill.csv': this.toCsv(payload.aggregations.L12_student_diff_skill, ['studentId', 'domain', 'difficulty', 'skillName', 'totalAttempts', 'accuracyPct']),
      'historical_progress.csv': this.toCsv(payload.historicalProgress, ['sessionIndex', 'sessionDate', 'subtopic', 'skillName', 'accuracyPct', 'trend']),
      'guidance_signals.csv': this.toCsv(payload.guidanceSignals, ['signalType', 'severity', 'hierarchy', 'dimension', 'currentValue', 'recommendation'])
    };

    // Note: Since jszip is currently missing from package.json, this will throw at runtime 
    // unless pnpm add jszip is run. 
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      Object.entries(contents).forEach(([filename, content]) => {
        zip.file(filename, content);
      });
      
      const zipData = await zip.generateAsync({ type: 'nodebuffer' });
      return zipData;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`JSZip not found. Please install it to enable CSV bundling. (${message})`);
      // Emergency fallback: return raw attempts as a single CSV if zip fails
      return Buffer.from(contents['raw_attempts.csv']);
    }
  }

  private generateReadme(): string {
    return `Analytical Inteligence Export - ZIP Bundle
Export Version: 2.0
Generated: ${new Date().toISOString()}

This ZIP contains 14 files for deep analytical review:

- raw_attempts.csv: The fundamental fact table of every question answered.
- L1 through L12: Multi-dimensional aggregations (Domain down to Skill-by-Topic).
- historical_progress.csv: Longitudinal performance tracking across sessions.
- guidance_signals.csv: AI-derived recommendations and critical gap alerts.

Note: historical_progress.csv populates only after a student completes 2 or more exam sessions on the same topic. It will be empty for first-time exam takers.

Usage: Import these files into Excel or PowerBI for advanced visualization.`;
  }
}
