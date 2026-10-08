import { iconMap } from "@/lib/CoursesCardData";

interface CommunityCardProps {
  icon: keyof typeof iconMap;
  heading: string;
  subline: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'indigo' | 'pink';
}

export const CommunityCard = ({ icon, heading, subline, color = 'blue' }: CommunityCardProps) => {
  const IconComponent = iconMap[icon];
  
  // Color configuration
  const colorConfig = {
    blue: {
      border: 'bg-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      hoverBorder: 'hover:border-blue-400'
    },
    green: {
      border: 'bg-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      hoverBorder: 'hover:border-green-400'
    },
    orange: {
      border: 'bg-orange-500',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      hoverBorder: 'hover:border-orange-400'
    },
    purple: {
      border: 'bg-purple-500',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      hoverBorder: 'hover:border-purple-400'
    },
    red: {
      border: 'bg-red-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      hoverBorder: 'hover:border-red-400'
    },
    teal: {
      border: 'bg-teal-500',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      hoverBorder: 'hover:border-teal-400'
    },
    indigo: {
      border: 'bg-indigo-500',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      hoverBorder: 'hover:border-indigo-400'
    },
    pink: {
      border: 'bg-pink-500',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      hoverBorder: 'hover:border-pink-400'
    }
  };
  
  const colors = colorConfig[color];
  
  return (
    <div className={`group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 ${colors.hoverBorder}`}>
      {/* Top border with selected color */}
      <div className={`h-1 ${colors.border} rounded-t-xl -mx-6 -mt-6 mb-6`}></div>
      
      <div className="flex flex-col items-center text-center">
        {/* Icon with selected color */}
        <div className={`mb-4 p-3 ${colors.iconBg} rounded-lg`}>
          <IconComponent className={`text-2xl ${colors.iconColor}`} />
        </div>
        
        {/* Heading */}
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          {heading}
        </h3>
        
        {/* Subline */}
        <p className="text-gray-600">
          {subline}
        </p>
      </div>
    </div>
  );
};
