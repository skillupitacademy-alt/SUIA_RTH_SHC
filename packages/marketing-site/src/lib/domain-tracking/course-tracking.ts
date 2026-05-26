import { trackEvent } from "../tracking";

export function trackCourseViewed(input: {
  courseSlug: string;
  courseName: string;
  courseCategory?: string;
  instructor?: string;
}) {
  trackEvent("education.course_viewed", input);
}

export function trackCourseEnrollClicked(input: {
  courseSlug: string;
  courseName: string;
  buttonLocation: string;
  courseCategory?: string;
}) {
  trackEvent("education.course_enroll_clicked", input);
}

