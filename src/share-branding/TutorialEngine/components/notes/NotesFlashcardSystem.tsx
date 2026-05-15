import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface NotesFlashcardSystemProps {
  cards: Flashcard[];
}

/**
 * Flashcard Visual System Component
 * Renderer: flashcard_visual_system
 * Purpose: Interactive Q&A system for active recall
 */
export function NotesFlashcardSystem({ cards }: NotesFlashcardSystemProps) {
  const brand = useBrand();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextCard = () => {
    if (currentIndex < cards.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const prevCard = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  if (!cards || cards.length === 0) return null;

  return (
    <div className="w-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <span className="text-sm font-bold">4</span>
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Flashcard System</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-400">
            {currentIndex + 1} / {cards.length}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={prevCard}
              disabled={currentIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 disabled:opacity-30"
              aria-label="Previous flashcard"
            >
              <Icons.ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextCard}
              disabled={currentIndex === cards.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 disabled:opacity-30"
              aria-label="Next flashcard"
            >
              <Icons.ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Flashcards (showing 4 at a time on desktop, or a slider) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => (
          <div 
            key={card.id} 
            className={`group relative min-h-[220px] cursor-pointer perspective-1000 transition-all duration-500 ${
              idx === currentIndex ? 'scale-105 ring-2 ring-primary-light ring-offset-4' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <div className="h-full w-full rounded-2xl bg-white p-6 shadow-lg border border-slate-100 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <span className="text-xs font-black">Q</span>
              </div>
              <h4 className="text-[14px] font-bold text-slate-900 mb-4">{card.question}</h4>
              <div className="mt-auto flex items-center gap-2">
                 <div className="h-6 w-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                   <span className="text-[10px] font-black">A</span>
                 </div>
                 <p className="text-[12px] font-medium text-slate-600 line-clamp-3">
                   {card.answer}
                 </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-1.5">
        {cards.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-slate-200'}`}
          />
        ))}
      </div>
    </div>
  );
}
