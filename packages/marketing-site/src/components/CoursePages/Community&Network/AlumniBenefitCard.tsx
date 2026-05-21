import { IconType } from "react-icons";
import { iconMap } from "@quiz/marketing-site/lib/CoursesCardData";

interface AlumniBenefitCardProps {
  icon: keyof typeof iconMap;
  name: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'indigo' | 'pink';
}

export const AlumniBenefitCard = ({ icon, name, color = 'blue' }: AlumniBenefitCardProps) => {
  const IconComponent = iconMap[icon];
  
  // Color configuration
  const colorConfig = {
    blue: {
      iconBg: 'bg-blue-500',
      iconHover: 'group-hover:bg-blue-600',
      border: 'border-blue-100',
      hoverBorder: 'hover:border-blue-300',
      hoverBg: 'from-blue-50 to-white',
      textHover: 'group-hover:text-blue-700'
    },
    green: {
      iconBg: 'bg-green-500',
      iconHover: 'group-hover:bg-green-600',
      border: 'border-green-100',
      hoverBorder: 'hover:border-green-300',
      hoverBg: 'from-green-50 to-white',
      textHover: 'group-hover:text-green-700'
    },
    orange: {
      iconBg: 'bg-orange-500',
      iconHover: 'group-hover:bg-orange-600',
      border: 'border-orange-100',
      hoverBorder: 'hover:border-orange-300',
      hoverBg: 'from-orange-50 to-white',
      textHover: 'group-hover:text-orange-700'
    },
    purple: {
      iconBg: 'bg-purple-500',
      iconHover: 'group-hover:bg-purple-600',
      border: 'border-purple-100',
      hoverBorder: 'hover:border-purple-300',
      hoverBg: 'from-purple-50 to-white',
      textHover: 'group-hover:text-purple-700'
    },
    red: {
      iconBg: 'bg-red-500',
      iconHover: 'group-hover:bg-red-600',
      border: 'border-red-100',
      hoverBorder: 'hover:border-red-300',
      hoverBg: 'from-red-50 to-white',
      textHover: 'group-hover:text-red-700'
    },
    teal: {
      iconBg: 'bg-teal-500',
      iconHover: 'group-hover:bg-teal-600',
      border: 'border-teal-100',
      hoverBorder: 'hover:border-teal-300',
      hoverBg: 'from-teal-50 to-white',
      textHover: 'group-hover:text-teal-700'
    },
    indigo: {
      iconBg: 'bg-indigo-500',
      iconHover: 'group-hover:bg-indigo-600',
      border: 'border-indigo-100',
      hoverBorder: 'hover:border-indigo-300',
      hoverBg: 'from-indigo-50 to-white',
      textHover: 'group-hover:text-indigo-700'
    },
    pink: {
      iconBg: 'bg-pink-500',
      iconHover: 'group-hover:bg-pink-600',
      border: 'border-pink-100',
      hoverBorder: 'hover:border-pink-300',
      hoverBg: 'from-pink-50 to-white',
      textHover: 'group-hover:text-pink-700'
    }
  };
  
  const colors = colorConfig[color];
  
  return (
    <div className={`group relative bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border ${colors.border} ${colors.hoverBorder}`}>
      {/* Hover effect background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.hoverBg} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      <div className="relative flex flex-col items-center text-center">
        {/* Icon with solid color */}
        <div className={`mb-4 p-3 ${colors.iconBg} ${colors.iconHover} rounded-xl transition-all duration-500`}>
          <IconComponent className="text-2xl text-white" />
        </div>
        
        {/* Benefit name with hover effect */}
        <span className={`text-lg font-bold text-gray-800 ${colors.textHover} transition-colors duration-300`}>
          {name}
        </span>
      </div>
    </div>
  );
};