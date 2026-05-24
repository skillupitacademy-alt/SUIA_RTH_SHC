"use client";
import { motion, Variants } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { CardItem, COLOR_CONFIGS, UNDERLINE_CONFIGS } from "@/lib/WhyUsData";

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
  const config = COLOR_CONFIGS[card.theme];
  const underlineColor = UNDERLINE_CONFIGS[card.underlineTheme];
  const Icon = card.icon; 

  return (
    <motion.div 
      variants={cardVariants} 
      className="h-full"
      whileHover={{ y: -5 }}
    >
      <div
        className={`
          h-full rounded-2xl p-6 lg:p-8 bg-white
          border-2 transition-transform transition-shadow duration-300
          flex flex-col sm:flex-row gap-6
          ${config.border} ${config.hoverBorder}
          shadow-2xl hover:shadow-lg
        `}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          <div
            className={`
              inline-flex items-center justify-center
              w-16 h-16 rounded-full
              ${config.iconBg}
            `}
          >
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className={`text-xl lg:text-2xl font-bold mb-2 ${config.heading}`}>
            {card.heading}
            <div
              className={`h-[3px] w-12 rounded-full mt-2 ${underlineColor}`}
            />
          </h3>

          <ul className="mt-4 space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.check}`} />
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
