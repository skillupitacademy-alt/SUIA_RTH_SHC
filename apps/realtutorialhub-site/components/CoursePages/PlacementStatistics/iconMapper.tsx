import {
  TrendingUp,
  Users,
  Briefcase,
  Target,
  Award,
  Clock,
  Star,
  Building,
  LucideIcon
} from 'lucide-react';

export const placementIconMap: Record<string, LucideIcon> = {
  'TrendingUp': TrendingUp,
  'Users': Users,
  'Briefcase': Briefcase,
  'Target': Target,
  'Award': Award,
  'Clock': Clock,
  'Star': Star,
  'Building': Building
};

export const getPlacementIcon = (iconName: string): LucideIcon => {
  return placementIconMap[iconName] || Building;
};

export const renderPlacementIcon = (iconName: string, className?: string) => {
  const Icon = getPlacementIcon(iconName);
  return <Icon className={className} />;
};
