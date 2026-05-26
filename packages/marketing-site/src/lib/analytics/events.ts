import { z } from "zod";

import type { AnalyticsBrandId } from "../../config/analytics";

export const ANALYTICS_SCHEMA_VERSION = 1 as const;

const basePayloadSchema = z.object({
  value: z.number().optional(),
  currency: z.string().length(3).optional(),
  courseId: z.string().min(1).optional(),
  courseSlug: z.string().min(1).optional(),
  courseName: z.string().min(1).optional(),
  courseCategory: z.string().min(1).optional(),
  instructor: z.string().min(1).optional(),
  lessonId: z.string().min(1).optional(),
  lessonName: z.string().min(1).optional(),
  referralCode: z.string().min(1).optional(),
  referralDestination: z.string().min(1).optional(),
  checkoutId: z.string().min(1).optional(),
  paymentId: z.string().min(1).optional(),
  paymentProvider: z.string().min(1).optional(),
  videoId: z.string().min(1).optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  buttonLocation: z.string().min(1).optional(),
  funnelId: z.string().min(1).optional(),
  funnelStep: z.string().min(1).optional(),
  leadChannel: z.enum(["whatsapp", "demo", "email", "call", "other"]).optional(),
});

const pageContextSchema = z.object({
  url: z.string().url(),
  path: z.string().min(1),
  title: z.string().optional(),
  referrer: z.string().optional(),
  hostname: z.string().min(1),
});

const attributionSchema = z.object({
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  term: z.string().optional(),
  content: z.string().optional(),
});

const deviceSchema = z.object({
  userAgent: z.string().optional(),
  locale: z.string().optional(),
  screen: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).optional(),
  type: z.enum(["mobile", "tablet", "desktop", "bot", "unknown"]).default("unknown"),
});

const userContextSchema = z.object({
  userId: z.string().optional(),
  anonymousId: z.string().min(1),
  loggedInState: z.enum(["anonymous", "authenticated"]).default("anonymous"),
  segment: z.string().optional(),
  leadScore: z.number().min(0).optional(),
  studentStage: z.string().optional(),
});

const sessionContextSchema = z.object({
  sessionId: z.string().min(1),
  requestId: z.string().min(1),
  occurredAt: z.string().datetime(),
  timezone: z.string().optional(),
});

export const analyticsEventContextSchema = z.object({
  brandId: z.custom<AnalyticsBrandId>((value) => value === "realtutorialhub" || value === "skillupitacademy"),
  schemaVersion: z.literal(ANALYTICS_SCHEMA_VERSION),
  page: pageContextSchema.optional(),
  attribution: attributionSchema.optional(),
  device: deviceSchema.optional(),
  user: userContextSchema,
  session: sessionContextSchema,
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
});

function withBasePayload<TSchema extends z.ZodRawShape>(shape: TSchema) {
  return basePayloadSchema.extend(shape);
}

export const analyticsEventDefinitions = {
  "education.course_viewed": {
    description: "A course details page or course context was viewed.",
    schema: withBasePayload({
      courseSlug: z.string().min(1),
      courseName: z.string().min(1),
    }),
  },
  "education.course_enroll_clicked": {
    description: "A user clicked an enrollment CTA.",
    schema: withBasePayload({
      courseSlug: z.string().min(1),
      courseName: z.string().min(1),
      buttonLocation: z.string().min(1),
    }),
  },
  "education.checkout_started": {
    description: "Checkout flow started.",
    schema: withBasePayload({
      checkoutId: z.string().min(1),
      courseSlug: z.string().min(1),
      courseName: z.string().min(1),
      value: z.number().nonnegative(),
      currency: z.string().length(3),
    }),
  },
  "education.payment_completed": {
    description: "Payment captured successfully.",
    schema: withBasePayload({
      checkoutId: z.string().min(1),
      paymentId: z.string().min(1),
      paymentProvider: z.string().min(1),
      courseSlug: z.string().min(1),
      courseName: z.string().min(1),
      value: z.number().nonnegative(),
      currency: z.string().length(3),
    }),
  },
  "education.lesson_completed": {
    description: "A learner completed a lesson.",
    schema: withBasePayload({
      lessonId: z.string().min(1),
      lessonName: z.string().min(1),
      courseSlug: z.string().min(1),
      courseName: z.string().min(1),
    }),
  },
  "education.video_progress_25": {
    description: "Video consumed to 25 percent.",
    schema: withBasePayload({
      videoId: z.string().min(1),
      progressPercent: z.literal(25),
      courseSlug: z.string().min(1).optional(),
      courseName: z.string().min(1).optional(),
    }),
  },
  "education.video_progress_50": {
    description: "Video consumed to 50 percent.",
    schema: withBasePayload({
      videoId: z.string().min(1),
      progressPercent: z.literal(50),
      courseSlug: z.string().min(1).optional(),
      courseName: z.string().min(1).optional(),
    }),
  },
  "education.video_progress_75": {
    description: "Video consumed to 75 percent.",
    schema: withBasePayload({
      videoId: z.string().min(1),
      progressPercent: z.literal(75),
      courseSlug: z.string().min(1).optional(),
      courseName: z.string().min(1).optional(),
    }),
  },
  "education.certificate_generated": {
    description: "A certificate was rendered or generated.",
    schema: withBasePayload({
      courseSlug: z.string().min(1),
      courseName: z.string().min(1),
    }),
  },
  "education.whatsapp_lead_started": {
    description: "A lead initiated a WhatsApp-based conversion action.",
    schema: withBasePayload({
      courseName: z.string().min(1),
      buttonLocation: z.string().min(1),
      leadChannel: z.literal("whatsapp"),
    }),
  },
  "education.demo_session_booked": {
    description: "A demo session booking completed.",
    schema: withBasePayload({
      courseName: z.string().min(1).optional(),
      leadChannel: z.literal("demo"),
    }),
  },
  "education.referral_shared": {
    description: "A referral share action occurred.",
    schema: withBasePayload({
      referralCode: z.string().min(1),
      referralDestination: z.string().min(1),
    }),
  },
  "education.page_viewed": {
    description: "A governed page view event for route tracking.",
    schema: withBasePayload({
      funnelId: z.string().min(1).optional(),
      funnelStep: z.string().min(1).optional(),
    }),
  },
} as const;

export type AnalyticsEventName = keyof typeof analyticsEventDefinitions;

type DefinitionMap = typeof analyticsEventDefinitions;

export type AnalyticsEventPayload<TEvent extends AnalyticsEventName> = z.infer<DefinitionMap[TEvent]["schema"]>;
export type AnalyticsEventContext = z.infer<typeof analyticsEventContextSchema>;

export type AnalyticsEventEnvelope<TEvent extends AnalyticsEventName = AnalyticsEventName> = {
  name: TEvent;
  payload: AnalyticsEventPayload<TEvent>;
  context: AnalyticsEventContext;
};

export const analyticsEventNames = Object.keys(analyticsEventDefinitions) as AnalyticsEventName[];

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return analyticsEventNames.includes(value as AnalyticsEventName);
}

export function getAnalyticsEventSchema<TEvent extends AnalyticsEventName>(name: TEvent) {
  return z.object({
    name: z.literal(name),
    payload: analyticsEventDefinitions[name].schema,
    context: analyticsEventContextSchema,
  });
}

export function normalizeAnalyticsEvent<TEvent extends AnalyticsEventName>(
  input: AnalyticsEventEnvelope<TEvent>,
): AnalyticsEventEnvelope<TEvent> {
  const schema = getAnalyticsEventSchema(input.name);
  const parsed = schema.parse(input);

  return {
    ...parsed,
    payload: Object.fromEntries(
      Object.entries(parsed.payload).filter(([, value]) => value !== undefined),
    ) as AnalyticsEventPayload<TEvent>,
    context: {
      ...parsed.context,
      metadata: Object.fromEntries(
        Object.entries(parsed.context.metadata).filter(([, value]) => value !== undefined),
      ),
    },
  } as AnalyticsEventEnvelope<TEvent>;
}

export function getAnalyticsEventDocumentation() {
  return analyticsEventNames.map((name) => ({
    name,
    description: analyticsEventDefinitions[name].description,
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
  }));
}
