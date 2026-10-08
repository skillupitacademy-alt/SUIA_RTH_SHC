import { LucideIcon } from 'lucide-react';

export interface HeroStat {
  value: string;
  label: string;
  icon: LucideIcon;
}

export interface HeroFeature {
  text: string;
  icon: LucideIcon;
}

export interface FloatingIcon {
  Icon: LucideIcon;
  top: string;
  left?: string;
  right?: string;
  delay: number;
}

export interface CTAButtons {
  primary: string;
  secondary: string;
}

export interface CourseHeroData {
  title: string;
  subtitle?: string;
  description: string;
  subDescription?: string;
  badgeText: string;
  stats: HeroStat[];
  features: HeroFeature[];
  floatingIcons: FloatingIcon[];
  companies: string[];
  ctaButtons: CTAButtons;
}