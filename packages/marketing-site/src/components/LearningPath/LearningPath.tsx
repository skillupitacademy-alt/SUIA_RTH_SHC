"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { CategorySelector } from "./CategorySelector";
import { PathwayCard } from "./PathwayCard";
import { MobileCategoryPanel } from "./MobileCategoryPanel";
import { VerticalScrollButton } from "./VerticalScrollButton";
import {
  getCategories,
  getLearningPaths,
  getCategoryColor,
  createCardId,
} from "./utils";
import { useSectionVisibilityLenis } from "./useSectionVisibilityLenis"; // Make sure this is imported
import { SectionHeader } from "../CommonHeader/SectionHeader";
import { LEARNINGPATH_CONFIG } from "@quiz/marketing-site/lib/LearningPath";

export default function LearningPath() {
  // State management
  const categories = getCategories();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [showMobileCategoryPanel, setShowMobileCategoryPanel] = useState(false);

  // Refs
  const sectionRef = useRef<HTMLDivElement>(null);

  // ✅ SINGLE source of truth for button visibility
  const showVerticalButton = useSectionVisibilityLenis("learning-path", 30);

  // Event handlers
  const toggleCardFlip = useCallback((cardId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  }, []);

  const scrollToLearningPath = useCallback(() => {
    sectionRef.current?.scrollIntoView({
      // behavior: "smooth",
      block: "start"
    });
    setShowMobileCategoryPanel(true);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    setFlippedCards({}); // Reset flipped cards when category changes
  }, []);

  // Derived values
  const currentPaths = getLearningPaths(activeCategory);
  const colors = getCategoryColor(activeCategory);

  return (
    <section
      id="learning-path"
      ref={sectionRef}
      className=" scroll-mt-24 lg:scroll-mt-28 w-full min-h-screen py-10 font-montserrat md:py-24 px-4 sm:px-6 lg:px-8 relative"
    >
      <VerticalScrollButton
        isVisible={showVerticalButton}
        onClick={scrollToLearningPath}
      />

      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title={LEARNINGPATH_CONFIG.title}
          description={LEARNINGPATH_CONFIG.description}
        />

        <CategorySelector
          active={activeCategory}
          onCategoryChange={handleCategoryChange}
        />

        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
            <AnimatePresence>
              {currentPaths.map((item) => {
                const id = createCardId(activeCategory, item.num);

                return (
                  <motion.div
                    key={id}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -90, opacity: 0 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                  >
                    <PathwayCard
                      item={item}
                      category={activeCategory}
                      isFlipped={flippedCards[id]}
                      onFlip={() => toggleCardFlip(id)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

      </div>

      <MobileCategoryPanel
        isOpen={showMobileCategoryPanel}
        activeCategory={activeCategory}
        onClose={() => setShowMobileCategoryPanel(false)}
        onCategorySelect={handleCategoryChange}
      />
    </section>
  );
}

