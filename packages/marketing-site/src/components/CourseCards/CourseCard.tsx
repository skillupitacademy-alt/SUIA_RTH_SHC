import { motion } from "framer-motion";
import type { MarketingCourseSnapshot } from "@quiz/marketing-site/content/courses";
import { ANIMATION_DELAY } from "@quiz/marketing-site/lib/CoursesCardData";

import CourseCardHeader from "./CourseCardHeader";
import CourseCardContent from "./CourseCardContent";
import CourseCardActions from "./CourseCardAction";
import CourseMetadata from "./CourseMetadata";

interface CourseCardProps {
  course: MarketingCourseSnapshot;
  index: number;
  isSingleCard: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, index, isSingleCard }) => {
  const isBlueCard = index % 2 === 0;

  return (
    <motion.div
      className={isSingleCard ? "w-full max-w-lg" : "w-full"}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.6,
        delay: index * ANIMATION_DELAY,
        ease: "easeOut",
      }}
      whileHover={{ y: -5 }}
    >
      <div
        className="
          bg-white rounded-2xl overflow-hidden
          shadow-2xl hover:shadow-lg
          transition-transform transition-shadow duration-300
          border border-gray-100
          flex flex-col
          w-full
        "
      >
        <CourseCardHeader course={course} isBlueCard={isBlueCard} />

        <div
          className="h-1"
          style={{
            backgroundColor: isBlueCard ? "var(--brand-primary)" : "var(--brand-secondary)",
          }}
        />

        <CourseCardContent course={course} isBlueCard={isBlueCard} />

        <div className="flex-1" />

        <div className="mt-auto pt-6 border-t border-gray-100">
          <CourseCardActions course={course} />
          <div className="mt-4">
            <CourseMetadata />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
