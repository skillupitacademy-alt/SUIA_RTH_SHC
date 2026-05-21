

import React from 'react';
import { POPULAR_COURSES, FOOTER_CONFIG } from '@/lib/FooterData';

const FooterCourse: React.FC = () => {
    return (
        <div>
            <h3 className="text-lg font-bold mb-4 text-gray-900">Popular Courses</h3>
            <ul className="space-y-2">
                {POPULAR_COURSES.map((course) => (
                    <li key={course.name} className="flex justify-between items-center p-2 rounded hover:bg-blue-500/10 cursor-pointer">
                        <div className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            <div className="text-gray-600">{course.name}</div>
                        </div>
                        <div className='bg-orange-100 text-orange-600 text-xs font-medium px-2 py-1 rounded'>
                            {course.students}
                        </div>
                    </li>
                ))}
            </ul>

        </div>
    );
};

export default FooterCourse;