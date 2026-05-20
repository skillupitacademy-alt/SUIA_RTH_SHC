export interface ProgressSectionPattern {
  title: string;
  description: string;
  stats: {
    completionPercentage: number;
    xpEarned: number;
    totalXp: number;
    streak: number;
    timeSpent: string;
  };
  milestones: Array<{
    id: string;
    title: string;
    status: 'completed' | 'current' | 'locked';
    xp: number;
  }>;
}
