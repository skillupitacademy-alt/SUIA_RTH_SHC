import { CATEGORIES } from "@quiz/marketing-site/lib/CoursesCardData";

interface FilterButtonsProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ 
  activeCategory, 
  setActiveCategory 
}) => {
  return (
    <div className="hidden md:flex flex-wrap justify-center gap-3 mb-12">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => setActiveCategory(category)}
          className={`
            px-5 py-2.5 rounded-full text-sm font-medium 
            transition-all duration-300 transform hover:scale-105
            border-2
            ${activeCategory === category
              ? "bg-orange-500 text-white border-orange-500 shadow-lg"
              : "bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:text-orange-600"
            }
          `}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default FilterButtons;




