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
              ? "text-white shadow-lg"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
            }
          `}
          style={
            activeCategory === category
              ? {
                  backgroundColor: "var(--brand-primary)",
                  borderColor: "var(--brand-primary)"
                }
              : undefined
          }
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default FilterButtons;




