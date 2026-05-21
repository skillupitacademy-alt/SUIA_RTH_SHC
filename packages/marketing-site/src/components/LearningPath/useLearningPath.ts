"use client";

import { useState, useRef, useCallback } from "react";
import {
  getCategories,
  getLearningPaths,
  getCategoryColor,
  createCardId,
} from "./utils";
import { useSectionVisibilityLenis } from "./useSectionVisibilityLenis";



export function useLearningPath() {
  const categories = getCategories();

  // Core state
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [showMobileCategoryPanel, setShowMobileCategoryPanel] = useState(false);

  // Section ref (still useful for scrollIntoView)
  const sectionRef = useRef<HTMLDivElement>(null);

  // ✅ Visibility handled declaratively
  const showVerticalButton = useSectionVisibilityLenis("learning-path");

  /* ---------------- Handlers ---------------- */

  const toggleCardFlip = useCallback((cardId: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    setFlippedCards({});
  }, []);

  const scrollToLearningPath = useCallback(() => {
    sectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setShowMobileCategoryPanel(true);
  }, []);

  /* ---------------- Derived data ---------------- */

  const currentPaths = getLearningPaths(activeCategory);
  const colors = getCategoryColor(activeCategory);

  return {
    // refs
    sectionRef,

    // state
    activeCategory,
    flippedCards,
    showVerticalButton,
    showMobileCategoryPanel,

    // derived
    currentPaths,
    colors,

    // actions
    toggleCardFlip,
    handleCategoryChange,
    scrollToLearningPath,
    setShowMobileCategoryPanel,
    createCardId,
  };
}
