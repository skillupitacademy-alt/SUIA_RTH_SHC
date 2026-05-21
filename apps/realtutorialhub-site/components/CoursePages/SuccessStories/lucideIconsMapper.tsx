import React from 'react';
import {
  GraduationCap,
  Briefcase,
  DollarSign,
  Globe,
  TrendingUp,
  Quote,
  LucideIcon
} from 'lucide-react';

export const lucideIconMap: Record<string, LucideIcon> = {
  'GraduationCap': GraduationCap,
  'Briefcase': Briefcase,
  'DollarSign': DollarSign,
  'Globe': Globe,
  'TrendingUp': TrendingUp,
  'Quote': Quote
};

export const getLucideIcon = (iconName: string): LucideIcon => {
  return lucideIconMap[iconName] || GraduationCap;
};