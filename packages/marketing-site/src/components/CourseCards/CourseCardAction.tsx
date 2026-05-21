'use client';

import { useRouter } from 'next/navigation';
import { Course } from '@quiz/marketing-site/lib/CoursesCardData';

interface CourseCardActionsProps {
  course: Course;
}

const CourseCardActions: React.FC<CourseCardActionsProps> = ({ course }) => {
  const router = useRouter();

  if (!course.slug) return null;

const handleViewDetails = (e: React.MouseEvent) => {
  e.preventDefault();

  sessionStorage.setItem('showCourseLoader', 'true');

  router.push(`/courses/${course.slug}`);
};


  return (
    <div className="flex flex-col space-y-3 p-5">
      <div className="flex gap-3">
        {/* VIEW DETAILS */}
        <button
          onClick={handleViewDetails}
          className="flex-1 w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
        >
          <span>View Details</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* ENROLL */}
        <button className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border-0">
          Enroll Now
        </button>
      </div>
    </div>
  );
};

export default CourseCardActions;
