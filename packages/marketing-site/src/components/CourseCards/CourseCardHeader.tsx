import Image from "next/image";
import { Course } from "@quiz/marketing-site/lib/CoursesCardData";

interface CourseCardHeaderProps {
  course: Course;
  isBlueCard: boolean;
}

const CourseCardHeader: React.FC<CourseCardHeaderProps> = ({
  course,
  isBlueCard
}) => {
  return (
    <header className="relative h-48 w-full overflow-hidden bg-gray-100">
      {/* Course Image */}
      <Image
        src={course.image}
        alt={`${course.title} course preview`}
        fill
        priority={false}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"
        aria-hidden="true"
      />

      {/* Format Badge */}
      <div className="absolute top-4 left-4">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full backdrop-blur-sm"
          aria-label={`Course format: ${course.format}`}
        >
          <span
            className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"
            aria-hidden="true"
          />
          {course.format}
        </span>
      </div>

      {/* Category Badge */}
      <div className="absolute bottom-4 left-4">
        <span
          className="px-3 py-1.5 text-white text-xs font-bold rounded-full bg-opacity-90"
          style={{
            backgroundColor: isBlueCard
              ? "var(--brand-primary)"
              : "var(--brand-secondary)"
          }}
          aria-label={`Course category: ${course.category}`}
        >
          {course.category}
        </span>
      </div>
    </header>
  );
};

export default CourseCardHeader;
