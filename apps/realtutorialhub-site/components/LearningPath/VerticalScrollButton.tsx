"use client";
import { motion, AnimatePresence } from "framer-motion";
import { VerticalScrollButtonProps } from "@/lib/LearningPath";
import { useEffect, useState } from "react";

export function VerticalScrollButton({ isVisible, onClick }: VerticalScrollButtonProps) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isVisible) {
      // Show button immediately when visible
      setShowButton(true);
    } else {
      // Hide button after a short delay to prevent flickering
      timeoutId = setTimeout(() => {
        setShowButton(false);
      }, 20);
    }

    return () => clearTimeout(timeoutId);
  }, [isVisible]);

  if (!showButton) return null;

  return (
    <AnimatePresence>
      {showButton && (
        <motion.button
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="
            md:hidden 
            fixed top-1/2 right-0 
            transform -translate-y-1/2
            h-32 w-14
            rounded-l-2xl 
            shadow-2xl
            bg-gradient-to-b from-blue-500 to-blue-400
            flex items-center justify-center
            z-[9999]
            transition-all duration-300
            active:scale-95
          "
          style={{ pointerEvents: "auto", cursor: "pointer" }}
          onClick={onClick}
          aria-label="Scroll to Learning Path"
        >
          <span
            className="text-white text-sm font-bold whitespace-nowrap"
            style={{
              transform: 'rotate(90deg)',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            Learning Path
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}