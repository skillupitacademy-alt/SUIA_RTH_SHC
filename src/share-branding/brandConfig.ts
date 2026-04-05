export interface BrandConfig {
  // Identity
  brandName: string;

  // Colors
  primaryColor: string;     // RTH: #d03f00, SkillUp: #f54a8d
  secondaryColor: string;   // RTH: #124fd6, SkillUp: #133382
  primaryRgb: string;       // For shadow rgba values

  // Hero Section
  heroHeadingLine1: string;
  heroHeadingLine2: string;

  // Tutor Section
  tutorLabel: string;          // "AI Tutor" | "Live Mentor"
  tutorBadgeText: string;      // "AI-Powered Learning" | "Expert-Led Training"
  tutorHeading: string;
  tutorDescription: string;
  tutorButtonText: string;
  tutorChatResponse: string;
  tutorContextLabel: string;

  // Comparison & Testimonials
  ecosystemLabel: string;      // "RealTutorialHub Ecosystem" | "SkillUp Ecosystem"
  tutorComparisonLabel: string; // "AI Tutor Support" | "Live Mentor Support"
  testimonialMention: string;  // Brand name used in testimonials

  // Pricing
  pricingTutorLabel: string;   // "Limited AI Tutor queries" | "Limited Live Mentor sessions"
  pricingTutorUnlimited: string; // "Unlimited AI Tutor" | "Unlimited Live Mentor"

  // Footer
  footerDescription: string;
  footerCopyright: string;
}

export const rthConfig: BrandConfig = {
  brandName: 'RealTutorialHub',

  primaryColor: '#d03f00',
  secondaryColor: '#124fd6',
  primaryRgb: '208,63,0',

  heroHeadingLine1: 'Learn Smarter.',
  heroHeadingLine2: 'Not Harder.',

  tutorLabel: 'AI Tutor',
  tutorBadgeText: 'AI-Powered Learning',
  tutorHeading: 'Stuck? Ask AI — Get Answers Based on Your Exact Topic',
  tutorDescription: 'Our AI Tutor is context-aware and provides guidance without spoon-feeding answers',
  tutorButtonText: 'Try AI Tutor Free',
  tutorChatResponse: 'Based on the lesson you just completed on functions, let me guide you through recursion step by step...',
  tutorContextLabel: '✨ Powered by your learning context',

  ecosystemLabel: 'RealTutorialHub Ecosystem',
  tutorComparisonLabel: 'AI Tutor Support',
  testimonialMention: 'RealTutorialHub',

  pricingTutorLabel: 'Limited AI Tutor queries',
  pricingTutorUnlimited: 'Unlimited AI Tutor',

  footerDescription: 'The most advanced structured learning engine designed for modern developers and tech professionals.',
  footerCopyright: '© 2026 RealTutorialHub. All rights reserved.',
};

export const skillUpConfig: BrandConfig = {
  brandName: 'SkillUp IT Academy',

  primaryColor: '#f54a8d',
  secondaryColor: '#133382',
  primaryRgb: '245,74,141',

  heroHeadingLine1: 'Skill Up.',
  heroHeadingLine2: 'Stand Out.',

  tutorLabel: 'Live Mentor',
  tutorBadgeText: 'Expert-Led Training',
  tutorHeading: 'Stuck? Ask Your Mentor — Get Guided by Industry Experts',
  tutorDescription: 'Our Live Mentors provide real-time, context-aware guidance tailored to your current lesson',
  tutorButtonText: 'Connect with a Mentor',
  tutorChatResponse: 'Based on the lesson you just completed on functions, let me walk you through recursion with a real example...',
  tutorContextLabel: '✨ Powered by expert mentorship',

  ecosystemLabel: 'SkillUp Ecosystem',
  tutorComparisonLabel: 'Live Mentor Support',
  testimonialMention: 'SkillUp IT Academy',

  pricingTutorLabel: 'Limited Live Mentor sessions',
  pricingTutorUnlimited: 'Unlimited Live Mentor',

  footerDescription: 'Industry-ready IT training powered by expert mentors and hands-on practice.',
  footerCopyright: '© 2026 SkillUp IT Academy. All rights reserved.',
};
