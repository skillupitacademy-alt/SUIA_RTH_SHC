"use client";

import { useEffect, useRef, useState } from "react";

interface LazySectionProps {
  children: React.ReactNode;
  skeleton: React.ReactNode;
  delay?: number;
  rootMargin?: string;
}

export const LazySection = ({
  children,
  skeleton,
  delay = 1000,
  rootMargin = "150px 0px",
}: LazySectionProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);


  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
        rootMargin,
      }
    );


    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // 2️⃣ Delay before showing actual content
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setShowContent(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, delay]);

  return (
    <div ref={ref} className="transition-opacity duration-300">
      {!showContent ? skeleton : children}
    </div>
  );
};
