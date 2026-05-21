'use client';

import { useState, useEffect, useRef } from 'react';

export const useCounterAnimation = (
  targetValues: Record<string, number>,
  threshold: number = 0.3
) => {
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            startCounterAnimation(targetValues);
          }
        });
      },
      { threshold }
    );

    const element = sectionRef.current;
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [hasAnimated, targetValues, threshold]);

  const startCounterAnimation = (targets: Record<string, number>) => {
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const newCounters: Record<string, number> = {};
      Object.keys(targets).forEach(key => {
        newCounters[key] = targets[key] * easeOutCubic;
      });

      setCounters(newCounters);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  return {
    counters,
    sectionRef,
    hasAnimated
  };
};