import { iconMap } from "@quiz/marketing-site/lib/CoursesCardData";

interface TechnicalFeatureCardProps {
  icon: keyof typeof iconMap;
  title: string;
  description: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'indigo' | 'pink';
}

export const TechnicalFeatureCard = ({ icon, title, description, color = 'blue' }: TechnicalFeatureCardProps) => {
  const IconComponent = iconMap[icon];
  
  // Color configuration
  const colorConfig = {
    blue: {
      accent: 'bg-gradient-to-r from-blue-400 to-blue-500',
      iconBg: 'from-blue-100 to-blue-50',
      iconBorder: 'border-blue-200',
      iconText: 'text-blue-600',
      hoverIconBg: 'from-blue-50 to-blue-100',
      hoverIconBorder: 'border-blue-300',
      hoverIconText: 'text-blue-700',
      title: 'text-blue-900',
      hoverTitle: 'text-blue-800',
      description: 'text-blue-700/80',
      border: 'border-blue-100',
      hoverBorder: 'hover:border-blue-300'
    },
    green: {
      accent: 'bg-gradient-to-r from-green-400 to-green-500',
      iconBg: 'from-green-100 to-green-50',
      iconBorder: 'border-green-200',
      iconText: 'text-green-600',
      hoverIconBg: 'from-green-50 to-green-100',
      hoverIconBorder: 'border-green-300',
      hoverIconText: 'text-green-700',
      title: 'text-green-900',
      hoverTitle: 'text-green-800',
      description: 'text-green-700/80',
      border: 'border-green-100',
      hoverBorder: 'hover:border-green-300'
    },
    orange: {
      accent: 'bg-gradient-to-r from-orange-400 to-orange-500',
      iconBg: 'from-orange-100 to-orange-50',
      iconBorder: 'border-orange-200',
      iconText: 'text-orange-600',
      hoverIconBg: 'from-orange-50 to-orange-100',
      hoverIconBorder: 'border-orange-300',
      hoverIconText: 'text-orange-700',
      title: 'text-orange-900',
      hoverTitle: 'text-orange-800',
      description: 'text-orange-700/80',
      border: 'border-orange-100',
      hoverBorder: 'hover:border-orange-300'
    },
    purple: {
      accent: 'bg-gradient-to-r from-purple-400 to-purple-500',
      iconBg: 'from-purple-100 to-purple-50',
      iconBorder: 'border-purple-200',
      iconText: 'text-purple-600',
      hoverIconBg: 'from-purple-50 to-purple-100',
      hoverIconBorder: 'border-purple-300',
      hoverIconText: 'text-purple-700',
      title: 'text-purple-900',
      hoverTitle: 'text-purple-800',
      description: 'text-purple-700/80',
      border: 'border-purple-100',
      hoverBorder: 'hover:border-purple-300'
    },
    red: {
      accent: 'bg-gradient-to-r from-red-400 to-red-500',
      iconBg: 'from-red-100 to-red-50',
      iconBorder: 'border-red-200',
      iconText: 'text-red-600',
      hoverIconBg: 'from-red-50 to-red-100',
      hoverIconBorder: 'border-red-300',
      hoverIconText: 'text-red-700',
      title: 'text-red-900',
      hoverTitle: 'text-red-800',
      description: 'text-red-700/80',
      border: 'border-red-100',
      hoverBorder: 'hover:border-red-300'
    },
    teal: {
      accent: 'bg-gradient-to-r from-teal-400 to-teal-500',
      iconBg: 'from-teal-100 to-teal-50',
      iconBorder: 'border-teal-200',
      iconText: 'text-teal-600',
      hoverIconBg: 'from-teal-50 to-teal-100',
      hoverIconBorder: 'border-teal-300',
      hoverIconText: 'text-teal-700',
      title: 'text-teal-900',
      hoverTitle: 'text-teal-800',
      description: 'text-teal-700/80',
      border: 'border-teal-100',
      hoverBorder: 'hover:border-teal-300'
    },
    indigo: {
      accent: 'bg-gradient-to-r from-indigo-400 to-indigo-500',
      iconBg: 'from-indigo-100 to-indigo-50',
      iconBorder: 'border-indigo-200',
      iconText: 'text-indigo-600',
      hoverIconBg: 'from-indigo-50 to-indigo-100',
      hoverIconBorder: 'border-indigo-300',
      hoverIconText: 'text-indigo-700',
      title: 'text-indigo-900',
      hoverTitle: 'text-indigo-800',
      description: 'text-indigo-700/80',
      border: 'border-indigo-100',
      hoverBorder: 'hover:border-indigo-300'
    },
    pink: {
      accent: 'bg-gradient-to-r from-pink-400 to-pink-500',
      iconBg: 'from-pink-100 to-pink-50',
      iconBorder: 'border-pink-200',
      iconText: 'text-pink-600',
      hoverIconBg: 'from-pink-50 to-pink-100',
      hoverIconBorder: 'border-pink-300',
      hoverIconText: 'text-pink-700',
      title: 'text-pink-900',
      hoverTitle: 'text-pink-800',
      description: 'text-pink-700/80',
      border: 'border-pink-100',
      hoverBorder: 'hover:border-pink-300'
    }
  };
  
  const colors = colorConfig[color];
  
  return (
    <div className={`group relative bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border ${colors.border} ${colors.hoverBorder}`}>
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${colors.accent} rounded-t-xl`}></div>
      
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`mb-4 p-4 bg-gradient-to-br ${colors.iconBg} rounded-xl border ${colors.iconBorder} group-hover:bg-gradient-to-br ${colors.hoverIconBg} group-hover:border ${colors.hoverIconBorder} transition-all duration-500`}>
          <IconComponent className={`text-2xl ${colors.iconText} group-hover:${colors.hoverIconText} transition-colors duration-500`} />
        </div>
        
        {/* Title */}
        <h3 className={`text-lg font-bold ${colors.title} mb-2 group-hover:${colors.hoverTitle} transition-colors duration-300`}>
          {title}
        </h3>
        
        {/* Description */}
        <p className={`text-sm`}>{description}</p>
      </div>
    </div>
  );
};