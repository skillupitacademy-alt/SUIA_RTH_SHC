

import { getCategories, getCategoryColor } from "./utils";
import { CategorySelectorProps } from "@quiz/marketing-site/lib/LearningPath";


export function CategorySelector({ 
  active, 
  onCategoryChange, 
  onHoverStart, 
  onHoverEnd 
}: CategorySelectorProps) {
  const categories = getCategories();

  const renderCategoryButton = (category: string) => {
    const colors = getCategoryColor(category);
    const isActive = active === category;
    
    return (
      <button
        key={category}
        onClick={() => onCategoryChange(category)}
        onMouseEnter={() => onHoverStart?.(category)}
        onMouseLeave={onHoverEnd}
        className={`
          relative px-6 py-3 rounded-xl font-bold transition-all duration-300
          transform hover:-translate-y-1 active:translate-y-0
          border-2 shadow-md min-w-[180px]
          ${isActive
            ? `${colors.solid} text-white border-transparent scale-105 shadow-lg`
            : `bg-white text-gray-700 border-gray-200 ${colors.hover} hover:shadow-lg`
          }
        `}
      >
        <span className="relative z-10 text-sm md:text-base whitespace-nowrap">
          {category}
        </span>
        {isActive && (
          <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-lg"></span>
        )}
      </button>
    );
  };

  return (
    <div className="mb-16 hidden md:block">
      <h2 className="text-center text-xl font-bold text-gray-800 mb-8 uppercase tracking-wider">
        SELECT YOUR CAREER TRACK
      </h2>
      <div className="flex flex-wrap justify-center gap-4 md:gap-5">
        {categories.map(renderCategoryButton)}
      </div>
    </div>
  );
}