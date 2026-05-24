'use client';

import { useRouter } from 'next/navigation';
import { Course } from '@quiz/marketing-site/lib/CoursesCardData';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';

interface CourseCardActionsProps {
  course: Course;
}

const CourseCardActions: React.FC<CourseCardActionsProps> = ({ course }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!course.slug) return null;

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();

    sessionStorage.setItem('showCourseLoader', 'true');

    startTransition(() => {
      router.push(`/courses/${course.slug}`);
    });
  };

  return (
    <div className="flex flex-col space-y-3 p-5">
      <div className="flex gap-3">
        {/* VIEW DETAILS */}
        <button
          onClick={handleViewDetails}
          disabled={isPending}
          className="flex-1 w-full py-3.5 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group disabled:opacity-75 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
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
            </>
          )}
        </button>

        {/* ENROLL */}
        <button
          className="flex-1 py-3.5 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border-0"
          style={{ backgroundColor: "var(--brand-secondary)" }}
        >
          Enroll Now
        </button>
      </div>
    </div>
  );
};

export default CourseCardActions;
