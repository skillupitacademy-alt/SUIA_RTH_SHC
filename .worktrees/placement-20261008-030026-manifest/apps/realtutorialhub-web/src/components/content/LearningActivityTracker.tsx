'use client';

import { useEffect } from 'react';

type LearningActivityTrackerProps = {
  subtopicPath: string;
  subtopicName: string;
};

export function LearningActivityTracker({ subtopicPath, subtopicName }: LearningActivityTrackerProps) {
  useEffect(() => {
    try {
      window.localStorage.setItem('rth-last-subtopic-path', subtopicPath);
      window.localStorage.setItem('rth-last-subtopic-name', subtopicName);
    } catch {
      // Ignore storage failures.
    }
  }, [subtopicName, subtopicPath]);

  return null;
}
