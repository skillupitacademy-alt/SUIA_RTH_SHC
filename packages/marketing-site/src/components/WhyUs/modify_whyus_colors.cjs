const fs = require('fs');

const dataPath = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/WhyUsData.ts';
let dataContent = fs.readFileSync(dataPath, 'utf8');

// Replace interfaces and CardItem array
const newInterfaces = `export interface CardItem {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  heading: string;
  subheading: string;
  colorHex: string;
}

export const WHY_US_CARDS: CardItem[] = [
  {
    id: 1,
    icon: Target,
    heading: "100% Placement Assistance",
    subheading: "Comprehensive career support with job placement assistance",
    colorHex: "#6366f1"
  },
  {
    id: 2,
    icon: Users,
    heading: "Live Interactive Classes",
    subheading: "Real-time learning with expert instructors",
    colorHex: "#e11d48"
  },
  {
    id: 3,
    icon: Layers,
    heading: "Hands-on Projects",
    subheading: "Practical experience with real-world projects",
    colorHex: "#10b981"
  },
  {
    id: 4,
    icon: Award,
    heading: "Industry Recognition",
    subheading: "Courses recognized by top industry leaders",
    colorHex: "#d97706"
  },
  {
    id: 5,
    icon: Globe,
    heading: "Lifelong Learning Community",
    subheading: "Continuous learning with peer support network",
    colorHex: "#8b5cf6"
  },
  {
    id: 6,
    icon: Briefcase,
    heading: "Assured Internship",
    subheading: "Guaranteed internship opportunities",
    colorHex: "#06b6d4"
  },
  {
    id: 7,
    icon: FileText,
    heading: "Industry-Ready Curriculum",
    subheading: "Designed in collaboration with leading tech companies",
    colorHex: "#d946ef"
  },
  {
    id: 8,
    icon: UserCheck,
    heading: "Expert Mentor Support",
    subheading: "1:1 mentorship from industry veterans",
    colorHex: "#0ea5e9"
  },
  {
    id: 9,
    icon: BookOpen,
    heading: "Structured Learning Path",
    subheading: "Personalized roadmap that adapts to your learning pace",
    colorHex: "#14b8a6"
  },
  {
    id: 10,
    icon: Headphones,
    heading: "Career Services & Support",
    subheading: "End-to-end career guidance and support",
    colorHex: "#f97316"
  },
  {
    id: 11,
    icon: Clock,
    heading: "Flexible Learning Schedule",
    subheading: "Learn at your own pace and convenience",
    colorHex: "#ec4899"
  },
  {
    id: 12,
    icon: BadgeCheck,
    heading: "Industry Certifications",
    subheading: "Earn recognized certifications to boost your career",
    colorHex: "#3b82f6"
  }
];

export const SECTION_CONFIG = {
  title: "Why Choose Us",
  description: "We're committed to your success with proven methods, industry-aligned curriculum and dedicated support to transform your career in technology.",
  accentColor: "from-blue-600 to-purple-600",
  textColor: "text-gray-900"
} as const;
`;

dataContent = dataContent.replace(/export interface CardItem[\s\S]*?\} as const;/m, newInterfaces);
fs.writeFileSync(dataPath, dataContent, 'utf8');

const cardPath = 'd:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/WhyUs/WhyUsCard.tsx';
let cardContent = fs.readFileSync(cardPath, 'utf8');

const newCardContent = `"use client";
import { motion, Variants } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { CardItem } from "@quiz/marketing-site/lib/WhyUsData";

interface WhyUsCardProps {
  card: CardItem;
}

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const WhyUsCard: React.FC<WhyUsCardProps> = ({ card }) => {
  const Icon = card.icon; 
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      variants={cardVariants} 
      className="h-full"
      whileHover={{ y: -5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="h-full rounded-2xl p-6 lg:p-8 bg-white border-2 transition-all duration-300 flex flex-col sm:flex-row gap-6 shadow-2xl"
        style={{
          borderColor: isHovered ? card.colorHex : '#f1f5f9',
          boxShadow: isHovered ? \`0 10px 25px -5px \${card.colorHex}33\` : ''
        }}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full"
            style={{ backgroundColor: card.colorHex }}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 
            className="text-xl lg:text-2xl font-bold mb-2 transition-colors duration-300"
            style={{ color: card.colorHex }}
          >
            {card.heading}
            <div
              className="h-[3px] w-12 rounded-full mt-2"
              style={{ backgroundColor: card.colorHex }}
            />
          </h3>

          <ul className="mt-4 space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 
                className="w-5 h-5 flex-shrink-0 mt-0.5" 
                style={{ color: card.colorHex }}
              />
              <span className="text-gray-600 text-sm lg:text-base leading-relaxed">
                {card.subheading}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default WhyUsCard;
`;

fs.writeFileSync(cardPath, newCardContent, 'utf8');
console.log('Modified WhyUs cards successfully');
