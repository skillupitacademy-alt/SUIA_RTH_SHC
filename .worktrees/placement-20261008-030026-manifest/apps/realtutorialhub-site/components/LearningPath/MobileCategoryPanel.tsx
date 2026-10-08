"use client";
import { motion, AnimatePresence } from "framer-motion";
import { getCategories, getCategoryColor } from "./utils";
import { MobileCategoryPanelProps } from "@/lib/LearningPath";
import { useEffect } from "react";

export function MobileCategoryPanel({
  isOpen,
  activeCategory,
  onClose,
  onCategorySelect
}: MobileCategoryPanelProps) {
  const categories = getCategories();

  // Close on ESC key (accessibility)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex justify-end"
          onClick={onClose}
          aria-hidden={!isOpen}
        >
          <motion.div
            className="w-72 h-full bg-white shadow-2xl p-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-category-title"
          >
            <PanelHeader onClose={onClose} />
            <CategoryList
              categories={categories}
              activeCategory={activeCategory}
              onCategorySelect={(category) => {
                onCategorySelect(category);
                onClose();
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Header ---------------- */

function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2
        id="mobile-category-title"
        className="text-lg font-bold text-gray-800"
      >
        Select Career Track
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="text-gray-500 text-2xl leading-none hover:text-black transition-colors"
        aria-label="Close category panel"
      >
        ×
      </button>
    </div>
  );
}

/* ---------------- Category List ---------------- */

interface CategoryListProps {
  categories: string[];
  activeCategory: string;
  onCategorySelect: (category: string) => void;
}

function CategoryList({
  categories,
  activeCategory,
  onCategorySelect
}: CategoryListProps) {
  return (
    <div className="flex flex-col gap-3">
      {categories.map((category) => {
        const colors = getCategoryColor(category);
        const isActive = activeCategory === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onCategorySelect(category)}
            aria-pressed={isActive}
            className={`
              w-full px-4 py-3 rounded-lg text-left text-sm font-medium
              border transition-all duration-200
              ${isActive
                ? `${colors.solid} text-white border-transparent shadow-md`
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }
            `}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
