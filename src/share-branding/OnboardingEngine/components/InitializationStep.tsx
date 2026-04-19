'use client';

import { useEffect, useState } from 'react';
import { useBrand } from '@/share-branding/OnboardingEngine/context/BrandContext';
import { Loader2 } from 'lucide-react';

interface InitializationStepProps {
  messages: string[];
  subtitle: string;
  onComplete: () => void;
}

export function InitializationStep({ messages, subtitle, onComplete }: InitializationStepProps) {
  const brand = useBrand();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 80);

    // Message rotation
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev >= messages.length - 1) {
          clearInterval(messageInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8">
      {/* Spinner */}
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ backgroundColor: brand.accentBackground }}
        >
          <Loader2
            className="w-12 h-12 animate-spin"
            style={{ color: brand.primaryColor }}
            strokeWidth={2.5}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md space-y-3">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: brand.primaryColor
            }}
          />
        </div>
        <div className="text-center text-sm text-slate-600 font-medium">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Loading Message */}
      <div className="text-center space-y-2">
        <h1
          className="text-2xl font-bold transition-all"
          style={{ color: brand.primaryColor }}
        >
          {messages[currentMessageIndex]}
        </h1>
        <p className="text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
}
