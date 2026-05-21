'use client';

import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { AssessmentHeader } from './AssessmentHeader';
import { FlipCard } from './FlipCard';
import { CertificateShowcase } from './CertificateShowcase';
import { useFlipCards } from './useFlipCards';
import { 
  FileText, ClipboardCheck, BarChart3, Award 
} from 'lucide-react';

interface AssessmentsCertificationProps {
  id: string; 
  title?: string;
  description?: string;
  assessmentCards?: Array<{
    id: number;
    title: string;
    description: string;
    features: string[];
    backContent: {
      points: string[];
      frequency: string;
      weightage: string;
    };
  }>;
  certificateData?: {
    title: string;
    description: string;
    benefits: string[];
    certificateDetails: {
      title: string;
      subtitle: string;
      subSubtitle: string;
      rating: number;
    };
  };
}

export default function AssessmentsCertification({ 
  id,
  title = "Assessment & Certification",
  description = "Comprehensive evaluation system ensuring mastery through multiple assessment formats",
  assessmentCards = [],
  certificateData
}: AssessmentsCertificationProps) {
  const { toggleFlip, isFlipped } = useFlipCards();

  useEffect(() => {
    AOS.init({
      duration: 700,
      once: true,
    });
    AOS.refresh();
  }, []);

  // Map icons based on card id
  const getIcon = (id: number) => {
    switch (id) {
      case 0: return <FileText className="w-7 h-7 md:w-16 md:h-16" />;
      case 1: return <ClipboardCheck className="w-7 h-7 md:w-16 md:h-16" />;
      case 2: return <BarChart3 className="w-7 h-7 md:w-16 md:h-16" />;
      case 3: return <Award className="w-7 h-7 md:w-16 md:h-16" />;
      default: return <FileText className="w-7 h-7 md:w-16 md:h-16" />;
    }
  };

  // Map colors based on card id
  const getCardStyles = (id: number) => {
    switch (id) {
      case 0:
        return {
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700'
        };
      case 1:
        return {
          color: 'from-green-500 to-emerald-600',
          bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700'
        };
      case 2:
        return {
          color: 'from-pink-500 to-pink-600',
          bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100',
          borderColor: 'border-pink-200',
          textColor: 'text-pink-700'
        };
      case 3:
        return {
          color: 'from-amber-500 to-orange-600',
          bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700'
        };
      default:
        return {
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700'
        };
    }
  };

  const enhancedCards = assessmentCards.map(card => ({
    ...card,
    icon: getIcon(card.id),
    ...getCardStyles(card.id)
  }));

  return (
    <div id={id} className="pt-10 min-h-screen bg-transparent p-4 md:p-8 pb-10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <AssessmentHeader title={title} description={description} />

        {/* Flip Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {enhancedCards.map((card) => (
            <FlipCard
              key={card.id}
              card={card}
              isFlipped={isFlipped(card.id)}
              onFlip={() => toggleFlip(card.id)}
            />
          ))}
        </div>

        {/* Certificate Showcase */}
        {certificateData && (
          <CertificateShowcase {...certificateData} />
        )}
      </div>

      {/* Add global CSS styles */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .transition-transform {
          transition: transform 0.6s;
        }
      `}</style>
    </div>
  );
}