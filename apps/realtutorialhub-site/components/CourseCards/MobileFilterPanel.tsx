"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '@/lib/CoursesCardData';

interface MobileFilterPanelProps {
  showMobileFilter: boolean;
  setShowMobileFilter: (show: boolean) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const MobileFilterPanel: React.FC<MobileFilterPanelProps> = ({
  showMobileFilter,
  setShowMobileFilter,
  activeCategory,
  setActiveCategory
}) => {
  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    // Close panel after selection
    setTimeout(() => {
      setShowMobileFilter(false);
    }, 200);
  };

  return (
    <AnimatePresence>
      {showMobileFilter && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex justify-end" 

          
          onClick={() => setShowMobileFilter(false)}
        >
          <motion.div
            className="w-72 h-full bg-white shadow-2xl p-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Course filter panel"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Filter Courses</h2>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="text-gray-500 text-2xl leading-none hover:text-black transition-colors"
                aria-label="Close filter panel"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`
                    w-full px-4 py-3 rounded-lg text-left text-sm font-medium 
                    border transition-all 
                    ${activeCategory === category
                      ? "bg-orange-500 text-white border-orange-500 shadow-md"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Close button at bottom for better UX */}
            <button
              onClick={() => setShowMobileFilter(false)}
              className="mt-6 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileFilterPanel;