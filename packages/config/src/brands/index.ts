export type SharedBrandId = 'realtutorialhub' | 'skillup' | 'skillhubcore';

export type EngineTarget = 'exam' | 'tutorial';

export interface BrandHeroStat {
  label: string;
  value: string;
}

export interface BrandFeatureCard {
  title: string;
  description: string;
}

export interface BrandJourneyStep {
  title: string;
  accent: string;
}

export interface BrandMethodCard {
  eyebrow: string;
  title: string;
  description: string;
}

export interface BrandProjectCard {
  title: string;
  description: string;
}

export interface BrandTestimonial {
  name: string;
  role: string;
  quote: string;
}

export interface BrandPricingPlan {
  name: string;
  priceLabel: string;
  summary: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean;
}

export interface BrandStartLearningOption {
  target: EngineTarget;
  title: string;
  description: string;
  href: string;
}

export interface SharedBrandDefinition {
  id: SharedBrandId;
  brandName: string;
  navLabel: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  heroHeadingLine1: string;
  heroHeadingLine2: string;
  heroCopy: string;
  heroBadges: string[];
  heroStats: BrandHeroStat[];
  featureCards: BrandFeatureCard[];
  journeySteps: BrandJourneyStep[];
  methodCards: BrandMethodCard[];
  tutorBadge: string;
  tutorHeading: string;
  tutorCopy: string;
  tutorResponse: string;
  comparisonTitle: string;
  comparisonCopy: string;
  comparisonRows: Array<{ label: string; shared: boolean; competitorOne: boolean; competitorTwo: boolean }>;
  projectCards: BrandProjectCard[];
  testimonials: BrandTestimonial[];
  pricingPlans: BrandPricingPlan[];
  footerCopy: string;
  footerCopyright: string;
  startLearning: {
    heading: string;
    copy: string;
    options: BrandStartLearningOption[];
  };
}

function buildEngineHref(target: EngineTarget, brand: SharedBrandId): string {
  const base = target === 'exam'
    ? 'https://quiz.skillhubcore.in/login'
    : 'https://tutorial.skillhubcore.in/login';

  return `${base}?brand=${brand}`;
}

export const realtutorialhubBrand: SharedBrandDefinition = {
  id: 'realtutorialhub',
  brandName: 'RealTutorialHub',
  navLabel: 'RTH',
  primaryColor: '#d03f00',
  secondaryColor: '#124fd6',
  tertiaryColor: '#7c3aed',
  heroHeadingLine1: 'Learn Smarter.',
  heroHeadingLine2: 'Not Harder.',
  heroCopy: 'A structured engine for tutorials, adaptive practice, AI guidance, projects, and measurable mastery that keeps every learner on one clear path.',
  heroBadges: ['Vibe Coding', 'Full Stack + AI', 'Data Analyst', 'System Design', 'Project Readiness'],
  heroStats: [
    { label: 'Structured blocks', value: '6' },
    { label: 'Practice loops', value: '24/7' },
    { label: 'Project tracks', value: '12+' },
  ],
  featureCards: [
    { title: 'Too many random tutorials', description: 'Content feels scattered and there is no clear route from basics to job-ready skill.' },
    { title: 'No structured progression', description: 'Learners jump between topics without understanding what comes next or why.' },
    { title: 'No contextual help', description: 'Questions pile up because support is disconnected from the exact topic being studied.' },
    { title: 'No measurable feedback', description: 'Weak areas stay hidden, so revision becomes guesswork instead of improvement.' },
  ],
  journeySteps: [
    { title: 'Learn', accent: '#d03f00' },
    { title: 'Practice', accent: '#124fd6' },
    { title: 'Get AI Help', accent: '#7c3aed' },
    { title: 'Build Projects', accent: '#0f766e' },
    { title: 'Improve', accent: '#0891b2' },
  ],
  methodCards: [
    { eyebrow: 'Layman block', title: 'Understand ideas in simple language first', description: 'Each concept starts with plain-English framing before definitions and syntax are introduced.' },
    { eyebrow: 'Reality block', title: 'Connect concepts to practical situations', description: 'Real-world framing makes abstract topics easier to remember and apply.' },
    { eyebrow: 'Technical block', title: 'Move into the exact technical meaning', description: 'Concepts tighten into formal language only after learners know what problem they solve.' },
    { eyebrow: 'Code block', title: 'See the idea working in real code', description: 'Examples stay close to the topic so practice maps directly to understanding.' },
    { eyebrow: 'AI Tutor block', title: 'Get contextual guidance without losing the thread', description: 'Support stays attached to the lesson and pushes learners toward understanding, not copy-paste answers.' },
    { eyebrow: 'Notes block', title: 'Retain the essential takeaways', description: 'Summaries make revision easier and help learners focus on the knowledge they must keep.' },
  ],
  tutorBadge: 'AI-Powered Learning',
  tutorHeading: 'Ask the AI tutor exactly where you are stuck.',
  tutorCopy: 'Guidance is tied to the lesson context so learners get focused explanations without breaking the flow of study.',
  tutorResponse: 'You just completed the lesson on functions. Let us break recursion down step by step with a simple mental model and then map it to code.',
  comparisonTitle: 'A guided ecosystem instead of disconnected content.',
  comparisonCopy: 'RTH combines explanation, practice, feedback, and remediation inside one system rather than leaving students to stitch tools together themselves.',
  comparisonRows: [
    { label: 'Structured learning journey', shared: true, competitorOne: false, competitorTwo: false },
    { label: 'Context-aware AI support', shared: true, competitorOne: false, competitorTwo: false },
    { label: 'Projects inside the same system', shared: true, competitorOne: false, competitorTwo: true },
    { label: 'Adaptive remediation', shared: true, competitorOne: false, competitorTwo: false },
  ],
  projectCards: [
    { title: 'Portfolio-backed assignments', description: 'Projects are sequenced to reinforce theory and create visible proof of work.' },
    { title: 'Remediation-led improvement', description: 'Weak areas trigger targeted follow-ups instead of leaving revision to chance.' },
    { title: 'Engine-based progression', description: 'Exam and tutorial surfaces stay aligned so practice and study reinforce each other.' },
  ],
  testimonials: [
    { name: 'Sarah J.', role: 'Software Engineer', quote: 'The structure removed the guesswork. I always knew what to study, what to practice, and what to improve next.' },
    { name: 'David K.', role: 'Data Analyst', quote: 'The remediation loop showed me exactly where I was weak and helped me close those gaps fast.' },
    { name: 'Elena R.', role: 'Full Stack Developer', quote: 'Projects and guided practice made my portfolio stronger than any scattered tutorial path ever did.' },
  ],
  pricingPlans: [
    {
      name: 'Foundation',
      priceLabel: 'Free',
      summary: 'Explore the structured learning model before committing.',
      features: ['Guided learning samples', 'Basic practice access', 'Introductory AI tutor usage'],
      ctaLabel: 'Explore the platform',
    },
    {
      name: 'Premium',
      priceLabel: '₹1000/mo',
      summary: 'Full structured learning, AI support, projects, and remediation.',
      features: ['Unlimited structured lessons', 'Unlimited guided practice', 'Projects and feedback loops'],
      ctaLabel: 'Start learning now',
      highlighted: true,
    },
  ],
  footerCopy: 'The structured learning engine for modern developers, analysts, and technical problem-solvers.',
  footerCopyright: '© 2026 RealTutorialHub. All rights reserved.',
  startLearning: {
    heading: 'Choose the engine that fits the way you want to learn.',
    copy: 'Both engines keep the same RealTutorialHub identity. Pick guided exam practice or the full tutorial learning flow and continue into the shared SkillHubCore surface with your brand context attached.',
    options: [
      {
        target: 'exam',
        title: 'Exam Engine',
        description: 'Timed practice, measured progress, and focused assessment loops.',
        href: buildEngineHref('exam', 'realtutorialhub'),
      },
      {
        target: 'tutorial',
        title: 'Tutorial Engine',
        description: 'Structured explanation, guided practice, AI help, and remediation.',
        href: buildEngineHref('tutorial', 'realtutorialhub'),
      },
    ],
  },
};

export const skillupBrand: SharedBrandDefinition = {
  id: 'skillup',
  brandName: 'SkillUp IT Academy',
  navLabel: 'SkillUp',
  primaryColor: '#f54a8d',
  secondaryColor: '#133382',
  tertiaryColor: '#0f766e',
  heroHeadingLine1: 'Skill Up.',
  heroHeadingLine2: 'Stand Out.',
  heroCopy: 'A hands-on learning and placement-focused experience that combines structured lessons, guided practice, mentor-backed support, and progression into job readiness.',
  heroBadges: ['Live Mentor', 'Placement Ready', 'Batch Progress', 'Hands-on Training', 'Career Focus'],
  heroStats: [
    { label: 'Mentor support', value: 'Live' },
    { label: 'Placement focus', value: '1 flow' },
    { label: 'Student surfaces', value: '4' },
  ],
  featureCards: [
    { title: 'Training without clarity', description: 'Students attend sessions but struggle to connect training, attendance, payments, and placement progress.' },
    { title: 'No single student shell', description: 'Important actions live in different places and the learner experience feels fragmented.' },
    { title: 'Limited mentor continuity', description: 'Support often loses context between the lesson, assignment, and next task.' },
    { title: 'Weak readiness visibility', description: 'Students cannot easily see how learning effort maps to placement readiness.' },
  ],
  journeySteps: [
    { title: 'Learn', accent: '#f54a8d' },
    { title: 'Practice', accent: '#133382' },
    { title: 'Ask Mentor', accent: '#0f766e' },
    { title: 'Build Profile', accent: '#7c3aed' },
    { title: 'Get Placement Ready', accent: '#0891b2' },
  ],
  methodCards: [
    { eyebrow: 'Instructor block', title: 'Learn with guided teaching first', description: 'Students start with structured instruction before moving into independent problem solving.' },
    { eyebrow: 'Practice block', title: 'Reinforce training through guided exercises', description: 'Assignments map directly to the topics students complete inside the program path.' },
    { eyebrow: 'Mentor block', title: 'Ask a mentor without losing context', description: 'Support stays attached to the learning flow so help is relevant and timely.' },
    { eyebrow: 'Batch block', title: 'Keep operations visible in one shell', description: 'Attendance, payments, and readiness stay connected to the learning experience.' },
    { eyebrow: 'Placement block', title: 'Move toward job readiness intentionally', description: 'Students progress from training into placement preparation without a disconnected experience.' },
    { eyebrow: 'Review block', title: 'Track readiness and close weak areas', description: 'Review loops help students understand what is complete and what still needs work.' },
  ],
  tutorBadge: 'Expert-Led Training',
  tutorHeading: 'Get mentor-backed guidance that matches the current learning step.',
  tutorCopy: 'SkillUp keeps instructor-led support close to the student workflow so help stays practical and placement-oriented.',
  tutorResponse: 'You just completed the lesson on functions. Let us walk through the same idea using a mentor-led example and show how it appears in interview-level tasks.',
  comparisonTitle: 'A student portal that stays connected to real training.',
  comparisonCopy: 'SkillUp combines batch operations, mentor-backed support, and learning surfaces so students do not bounce between disconnected systems.',
  comparisonRows: [
    { label: 'Mentor-connected learning path', shared: true, competitorOne: false, competitorTwo: false },
    { label: 'Attendance and payment visibility', shared: true, competitorOne: false, competitorTwo: false },
    { label: 'Placement-aware student journey', shared: true, competitorOne: false, competitorTwo: true },
    { label: 'Shared engine handoff with brand continuity', shared: true, competitorOne: false, competitorTwo: false },
  ],
  projectCards: [
    { title: 'Batch-led progression', description: 'Students move through the same shell for learning, practice, attendance, and follow-up actions.' },
    { title: 'Mentor-supported improvement', description: 'Support is available where students learn, not in a disconnected messaging layer.' },
    { title: 'Placement-aware readiness', description: 'The portal keeps the journey aligned with outcomes instead of isolating study from placement preparation.' },
  ],
  testimonials: [
    { name: 'Neha P.', role: 'Program Learner', quote: 'The portal kept classes, assignments, payments, and placement prep in one flow, which made everything easier to manage.' },
    { name: 'Rahul M.', role: 'Placement Candidate', quote: 'The mentor support felt connected to what I was actually learning, not generic advice.' },
    { name: 'Priya S.', role: 'SkillUp Student', quote: 'The structure made the jump from training to readiness feel intentional instead of chaotic.' },
  ],
  pricingPlans: [
    {
      name: 'Orientation',
      priceLabel: 'Explore',
      summary: 'View the learning structure and program pathway.',
      features: ['Program overview', 'Learning experience preview', 'Student flow introduction'],
      ctaLabel: 'Explore programs',
    },
    {
      name: 'Training Path',
      priceLabel: 'Mentor-led',
      summary: 'Structured learning, guided support, and placement-oriented progression.',
      features: ['Mentor-backed learning path', 'Student portal continuity', 'Readiness-focused journey'],
      ctaLabel: 'Start learning now',
      highlighted: true,
    },
  ],
  footerCopy: 'Industry-ready IT learning with one connected student experience from training to placement.',
  footerCopyright: '© 2026 SkillUp IT Academy. All rights reserved.',
  startLearning: {
    heading: 'Choose how you want to begin inside the SkillUp learning system.',
    copy: 'Both engines continue into the shared SkillHubCore surfaces while preserving the SkillUp brand identity needed for the correct student flow.',
    options: [
      {
        target: 'exam',
        title: 'Exam Engine',
        description: 'Assessment-driven practice with measured progression and readiness checks.',
        href: buildEngineHref('exam', 'skillup'),
      },
      {
        target: 'tutorial',
        title: 'Tutorial Engine',
        description: 'Guided learning, mentor-style support, and structured topic progression.',
        href: buildEngineHref('tutorial', 'skillup'),
      },
    ],
  },
};

export const skillhubcoreBrand: SharedBrandDefinition = {
  id: 'skillhubcore',
  brandName: 'SkillHubCore',
  navLabel: 'SkillHubCore',
  primaryColor: '#1d4ed8',
  secondaryColor: '#0f172a',
  tertiaryColor: '#0f766e',
  heroHeadingLine1: 'Shared Engines.',
  heroHeadingLine2: 'Brand-Aware Delivery.',
  heroCopy: 'The common service layer that powers shared exam, tutorial, and placement experiences while preserving brand-specific identity and flow.',
  heroBadges: ['Shared Services', 'Brand Context', 'Common Engines'],
  heroStats: [
    { label: 'Brands supported', value: '3' },
    { label: 'Shared engines', value: '2' },
    { label: 'Identity flow', value: 'Unified' },
  ],
  featureCards: [],
  journeySteps: [],
  methodCards: [],
  tutorBadge: 'Shared Engine Layer',
  tutorHeading: 'SkillHubCore is the common surface, not the brand shell.',
  tutorCopy: 'It exists here only as a future-ready definition so the shared landing framework can support a third identity without refactoring.',
  tutorResponse: 'Shared services, brand-aware entry points, and unified identity routing stay aligned.',
  comparisonTitle: 'SkillHubCore future brand definition',
  comparisonCopy: 'Prepared for runtime brand expansion without changing the shared landing framework.',
  comparisonRows: [],
  projectCards: [],
  testimonials: [],
  pricingPlans: [],
  footerCopy: 'Shared platform services for the wider learning ecosystem.',
  footerCopyright: '© 2026 SkillHubCore. All rights reserved.',
  startLearning: {
    heading: 'Choose an engine.',
    copy: 'Future-ready configuration for shared engine entry.',
    options: [
      {
        target: 'exam',
        title: 'Exam Engine',
        description: 'Shared assessment engine.',
        href: buildEngineHref('exam', 'skillhubcore'),
      },
      {
        target: 'tutorial',
        title: 'Tutorial Engine',
        description: 'Shared tutorial engine.',
        href: buildEngineHref('tutorial', 'skillhubcore'),
      },
    ],
  },
};

export const sharedBrandRegistry: Record<SharedBrandId, SharedBrandDefinition> = {
  realtutorialhub: realtutorialhubBrand,
  skillup: skillupBrand,
  skillhubcore: skillhubcoreBrand,
};
