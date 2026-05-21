import { iconMap } from "@/lib/CoursesCardData";

interface SupportChannelCardProps {
  icon: keyof typeof iconMap;
  name: string;
  description: string;
}

export const SupportChannelCard = ({
  icon,
  name,
  description,
}: SupportChannelCardProps) => {
  const IconComponent = iconMap[icon];

  return (
    <div className="group relative rounded-xl p-5 
      bg-gradient-to-br from-white to-slate-50
      border border-slate-200
      shadow-sm hover:shadow-xl
      transition-all duration-500
      hover:-translate-y-1
      hover:border-orange-300"
    >
      <div className="flex items-start">
        {/* Icon */}
        <div
          className="p-3 rounded-lg mr-3
          bg-gradient-to-br from-indigo-50 to-sky-100
          border border-indigo-200
          group-hover:from-orange-50 group-hover:to-orange-100
          group-hover:border-orange-300
          transition-all duration-500"
        >
          <IconComponent
            className="text-xl text-indigo-600
            group-hover:text-orange-500
            transition-colors duration-500"
          />
        </div>

        <div className="flex-1">
          {/* Title */}
          <h4
            className="font-semibold text-slate-800 mb-1
            group-hover:text-orange-600
            transition-colors duration-300"
          >
            {name}
          </h4>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
