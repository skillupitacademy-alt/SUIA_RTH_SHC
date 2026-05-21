import { IconType } from 'react-icons';
import { Course } from '@/lib/CoursesCardData';

interface CourseCardContentProps {
  course: Course;
  isBlueCard: boolean;
  Icon: IconType;
}

const CourseCardContent: React.FC<CourseCardContentProps> = ({
  course,
  isBlueCard,
  Icon
}) => {
  return (
    <div className="p-6 flex flex-col flex-1">
      <div className="mb-4">
        <div className={`p-3 rounded-xl inline-block ${isBlueCard ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <div className={isBlueCard ? 'text-blue-600' : 'text-orange-600'}>
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 min-h-[56px]">
        {course.title}
      </h3>

      <div className="mb-6 min-h-[72px]">
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {course.description}
        </p>
      </div>

      <div className={`h-px w-full mb-4 ${isBlueCard ? 'bg-blue-100' : 'bg-orange-100'}`}></div>

      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          KEY LEARNING OUTCOMES
        </h4>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {course.features.slice(0, 4).map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isBlueCard ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
              <span className="text-gray-700 text-sm truncate">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseCardContent;