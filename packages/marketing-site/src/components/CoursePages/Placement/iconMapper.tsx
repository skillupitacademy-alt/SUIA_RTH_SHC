import {
  FileText,
  Briefcase,
  Users,
  Building,
  CheckCircle,
  Sparkles,
  Target,
  Award,
  ShieldCheck,
  Zap,
  LucideIcon
} from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  'FileText': FileText,
  'Briefcase': Briefcase,
  'Users': Users,
  'Building': Building,
  'CheckCircle': CheckCircle,
  'Sparkles': Sparkles,
  'Target': Target,
  'Award': Award,
  'ShieldCheck': ShieldCheck,
  'Zap': Zap
};

export const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || FileText;
};