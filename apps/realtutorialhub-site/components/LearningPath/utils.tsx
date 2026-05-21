// import { categories, categoryColors, icons, learningPaths } from "@/lib/LearningPathData";
import { categories, categoryColors, icons, learningPaths } from "@/lib/LearningPath";
import { IconType } from "react-icons";

// Type-safe getters
export const getCategories = () => categories;

export const getCategoryColor = (category: string) =>
    categoryColors[category] || categoryColors["Full Stack with AI"];

export const getIconComponent = (num: number): IconType =>
    icons[num] || icons[1];

export const getLearningPaths = (category: string) =>
    learningPaths[category] || learningPaths["Full Stack with AI"];

export const createCardId = (category: string, num: number) =>
    `${category}-${num}`;

// Scroll utilities
export const isElementInViewport = (
    element: HTMLElement,
    windowHeight: number,
    topThreshold = 0.2,
    bottomThreshold = 0.8
): boolean => {
    const rect = element.getBoundingClientRect();
    return (
        rect.top <= windowHeight * bottomThreshold &&
        rect.bottom >= windowHeight * topThreshold
    );
};