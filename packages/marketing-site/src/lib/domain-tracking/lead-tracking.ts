import { trackEvent, trackLead } from "../tracking";

export function trackWhatsAppLeadStarted(courseName: string, buttonLocation: string) {
  trackLead(courseName, buttonLocation);
}

export function trackDemoSessionBooked(courseName?: string) {
  trackEvent("education.demo_session_booked", {
    courseName,
    leadChannel: "demo",
  });
}

