import { useEffect, useRef, useState, useCallback } from "react";

export function useAutoSlide(
  length: number,
  autoplayDelay: number,
  animationDuration: number,
  hydrated: boolean
) {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (isAnimating || nextIndex === index) return;

      setIsAnimating(true);
      setIndex(nextIndex);

      setTimeout(() => {
        setIsAnimating(false);
      }, animationDuration);
    },
    [index, isAnimating, animationDuration]
  );

  const next = useCallback(() => {
    if (!isPaused && !isAnimating) {
      goTo((index + 1) % length);
    }
  }, [index, length, isPaused, isAnimating, goTo]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isPaused && hydrated) {
      intervalRef.current = setInterval(next, autoplayDelay);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [next, autoplayDelay, isPaused, hydrated]);

  return {
    index,
    isAnimating,
    goTo,
    setPaused: setIsPaused
  };
}
