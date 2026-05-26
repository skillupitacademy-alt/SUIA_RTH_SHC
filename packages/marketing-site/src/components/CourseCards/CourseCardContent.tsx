import type { IconType } from 'react-icons';
import { FaBolt, FaBrain, FaChartBar, FaChartLine, FaCloud, FaCode, FaDatabase, FaMicrochip, FaShieldAlt, FaTerminal } from 'react-icons/fa';
import type { CourseIconName, MarketingCourseSnapshot } from '@quiz/marketing-site/content/courses';

interface CourseCardContentProps {
  course: MarketingCourseSnapshot;
  isBlueCard: boolean;
}

const iconMap: Record<CourseIconName, IconType> = {
  shield: FaShieldAlt,
  bolt: FaBolt,
  code: FaCode,
  database: FaDatabase,
  cloud: FaCloud,
  "chart-line": FaChartLine,
  "chart-bar": FaChartBar,
  microchip: FaMicrochip,
  terminal: FaTerminal,
  brain: FaBrain,
};

const CourseCardContent: React.FC<CourseCardContentProps> = ({ course, isBlueCard }) => {
  const accentColor = isBlueCard ? "var(--brand-primary)" : "var(--brand-secondary)";
  const Icon = iconMap[course.iconName];

  return (
    <div className="p-6 flex flex-col flex-1">
      <div className="mb-4">
        <div className="p-3 rounded-xl inline-block bg-gray-50">
          <div style={{ color: accentColor }}>
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 line-clamp-2 min-h-[56px] md:min-h-[64px]">
        {course.title}
      </h3>

      <div className="mb-6 min-h-[72px]">
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{course.description}</p>
      </div>

      <div className="h-px w-full mb-4 bg-gray-100"></div>

      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">KEY LEARNING OUTCOMES</h4>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {course.features.slice(0, 4).map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5"
                style={{ backgroundColor: accentColor }}
              ></div>
              <span className="text-gray-700 text-sm truncate">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseCardContent;
