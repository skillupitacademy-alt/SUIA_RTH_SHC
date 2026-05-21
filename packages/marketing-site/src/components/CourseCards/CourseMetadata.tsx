import React from "react";
import { FaClock, FaUsers } from "react-icons/fa";
import { COURSE_METADATA } from "@quiz/marketing-site/lib/CoursesCardData";

const CourseMetadata: React.FC = () => {
  return (
    <div className="mt-4 flex items-center justify-between text-xs text-gray-500 m-4">
      {/* Hours */}
      <div className="flex items-center gap-2">
        <FaClock className="w-4 h-4 text-gray-400" />
        <span className="font-medium">{COURSE_METADATA.hours}</span>
      </div>

      {/* Students */}
      <div className="flex items-center gap-2">
        <FaUsers className="w-4 h-4 text-gray-400" />
        <span className="font-medium">{COURSE_METADATA.students}</span>
      </div>
    </div>
  );
};

export default CourseMetadata;
