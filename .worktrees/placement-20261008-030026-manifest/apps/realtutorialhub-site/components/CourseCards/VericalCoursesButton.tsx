"use client";
import { motion } from 'framer-motion';

interface VerticalCoursesButtonProps {
  showVerticalCourses: boolean;
  onClick: () => void;
}

const VerticalCoursesButton: React.FC<VerticalCoursesButtonProps> = ({
  showVerticalCourses,
  onClick
}) => {
  if (!showVerticalCourses) return null;

  return (
    <motion.button
      onClick={onClick}
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      className="
        md:hidden 
        fixed top-1/2 right-0 -translate-y-1/2 
        h-32 w-14
        rounded-l-2xl 
        shadow-2xl
        bg-gradient-to-b from-orange-500 to-orange-400
        flex items-center justify-center
        z-[999]
        transition-all duration-300
      "
      style={{
        pointerEvents: "auto",
        cursor: "pointer"
      }}
    >
      <span
        className="text-white text-sm font-bold"
        style={{ transform: 'rotate(90deg)' }}
      >
        Courses
      </span>
    </motion.button>
  );
};

export default VerticalCoursesButton;