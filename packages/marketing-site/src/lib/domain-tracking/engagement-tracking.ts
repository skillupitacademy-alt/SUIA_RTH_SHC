import { trackEvent, trackVideoProgress } from "../tracking";

export function trackLessonCompleted(input: {
  lessonId: string;
  lessonName: string;
  courseSlug: string;
  courseName: string;
}) {
  trackEvent("education.lesson_completed", input);
}

export function trackGovernedVideoProgress(progress: 25 | 50 | 75, input: {
  videoId: string;
  progressPercent: 25 | 50 | 75;
  courseSlug?: string;
  courseName?: string;
}) {
  trackVideoProgress(progress, input);
}

