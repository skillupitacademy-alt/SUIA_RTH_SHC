import type { MarketingCourseSnapshot } from '@quiz/marketing-site/content/courses';

import CourseCard from './CourseCard';

interface CourseGridProps {
  courses: MarketingCourseSnapshot[];
  isSingleCard: boolean;
}

const CourseGrid: React.FC<CourseGridProps> = ({ courses, isSingleCard }) => {
  return (
    <div className={isSingleCard ? 'flex justify-center' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8'}>
      {courses.map((course, index) => (
        <CourseCard
          key={course.id}
          course={course}
          index={index}
          isSingleCard={isSingleCard}
        />
      ))}
    </div>
  );
};

export default CourseGrid;
