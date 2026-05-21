'use client';

import { useState, useEffect, useRef } from 'react';

interface CounterValues {
  [key: string]: number;
}

export const useCounterAnimation = (
  targetValues: CounterValues,
  threshold: number = 0.3
) => {
  const [counters, setCounters] = useState<CounterValues>({});
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
      {
        threshold,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [hasAnimated, targetValues, threshold]);

  const startCounterAnimation = (targets: CounterValues) => {
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const newCounters: CounterValues = {};
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