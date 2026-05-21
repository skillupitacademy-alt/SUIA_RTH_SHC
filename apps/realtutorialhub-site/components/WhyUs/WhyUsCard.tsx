"use client";
import { motion, Variants } from "framer-motion";

import { CardItem, COLOR_CONFIGS } from "@/lib/WhyUsData";

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
  const config = COLOR_CONFIGS[card.color][card.shade];
  const Icon = card.icon; 

  return (
    <motion.div variants={cardVariants} className="h-full">
      <div
        className={`
          h-full rounded-xl p-8
          border-2 transition-transform transition-shadow duration-300
          flex flex-col min-h-[280px]
          bg-gradient-to-br ${config.gradient}
          ${config.border} ${config.hoverBorder}
          shadow-2xl hover:shadow-xl
          hover:scale-[1.02]
        `}
      >
        {/* Icon */}
        <div className="mb-6">
          <div
            className={`
              inline-flex items-center justify-center
              w-14 h-14 lg:w-16 lg:h-16 rounded-xl
              bg-gradient-to-br ${config.iconGradient}
              shadow-lg shadow-black/20
            `}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <h3 className={`text-xl lg:text-2xl font-bold ${config.text}`}>
            {card.heading}
            <div
              className={`h-2 w-24 rounded-full mt-2 bg-gradient-to-r ${config.underline}`}
            />
          </h3>

          <p className="text-base lg:text-lg text-gray-600 leading-relaxed">
            {card.subheading}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default WhyUsCard;
