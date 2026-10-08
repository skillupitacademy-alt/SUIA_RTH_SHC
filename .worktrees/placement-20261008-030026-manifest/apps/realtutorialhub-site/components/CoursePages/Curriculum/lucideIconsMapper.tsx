import {
  Code, Server, Globe, Cloud, Brain, Rocket,
  Layers, Briefcase, Wrench, Target, ChevronDown,
  Cpu, Database, FileText, Users, ShoppingCart,
  LineChart, MessageSquare, Stethoscope, GitBranch,
  Shield, GraduationCap, Kanban, Music, X,
  LucideIcon
} from 'lucide-react';

export const lucideIconMap: Record<string, LucideIcon> = {
  'Code': Code,
  'Server': Server,
  'Globe': Globe,
  'Cloud': Cloud,
  'Brain': Brain,
  'Rocket': Rocket,
  'Layers': Layers,
  'Briefcase': Briefcase,
  'Wrench': Wrench,
  'Target': Target,
  'ChevronDown': ChevronDown,
  'Cpu': Cpu,
  'Database': Database,
  'FileText': FileText,
  'Users': Users,
  'ShoppingCart': ShoppingCart,
  'LineChart': LineChart,
  'MessageSquare': MessageSquare,
  'Stethoscope': Stethoscope,
  'GitBranch': GitBranch,
  'Shield': Shield,
  'GraduationCap': GraduationCap,
  'Kanban': Kanban,
  'Music': Music,
  'X': X
};

export const getLucideIcon = (iconName: string): LucideIcon => {
  return lucideIconMap[iconName] || Code;
};

export const renderLucideIcon = (iconName: string, className?: string) => {
  const Icon = getLucideIcon(iconName);
  return <Icon className={className} />;
};
