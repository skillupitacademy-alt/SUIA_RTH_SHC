"use client";
import { motion } from "framer-motion";
import { FaCheck, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { getIconComponent, getCategoryColor } from "./utils";
import {
  PathwayCardProps,
  LearningModule,
  CategoryColors,
} from "@/lib/LearningPath";

export function PathwayCard({
  item,
  category,
  isFlipped,
  onFlip,
}: PathwayCardProps) {
  const colors = getCategoryColor(category);
  const IconComponent = getIconComponent(item.num);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={`Learning module ${item.num}: ${item.title}`}
      className="card-wrapper cursor-pointer focus:outline-none focus:ring-2 focus:ring-transparent rounded-2xl"
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip();
        }
      }}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div
        className={`relative w-full h-[650px] shadow-2xl card ${
          isFlipped ? "is-flipped" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.6s ease",
        }}
      >
        <CardFront item={item} colors={colors} IconComponent={IconComponent} onFlip={onFlip} />
        <CardBack item={item} colors={colors} onBackClick={onFlip} />
      </div>
    </motion.div>
  );
}

// Front side component
interface CardFrontProps {
  item: LearningModule;
  colors: CategoryColors;
  IconComponent: React.ComponentType<{ className?: string }>;
  onFlip: () => void;
}

function CardFront({ item, colors, IconComponent, onFlip }: CardFrontProps) {
  return (
    <div
      className="card-face card-front absolute inset-0"
      style={{ backfaceVisibility: "hidden" }}
    >
      <div className="w-full h-full rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.15)] border border-gray-200 p-8 bg-white">
        <ModuleBadge num={item.num} colors={colors} />
        <CardContent
          item={item}
          colors={colors}
          IconComponent={IconComponent}
        />
        <ExploreMoreButton onFlip={onFlip} />
      </div>
    </div>
  );
}

// Back side component
interface CardBackProps {
  item: LearningModule;
  colors: CategoryColors;
  onBackClick: () => void;
}

function CardBack({ item, colors, onBackClick }: CardBackProps) {
  return (
    <div
      className="card-face card-back absolute inset-0"
      style={{
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
      }}
    >
      <div className="w-full h-full bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.15)] border border-gray-200 p-8 flex flex-col">
        <CardHeader item={item} colors={colors} />
        <PointsList points={item.points} colors={colors} />
        <BackButton onBackClick={onBackClick} />
      </div>
    </div>
  );
}

// Sub-components
function ModuleBadge({ num, colors }: { num: number; colors: CategoryColors }) {
  return (
    <div className="absolute top-6 right-6 z-20">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors.solid} shadow-lg`}
      >
        <span className="text-xl font-black text-white">{num}</span>
      </div>
    </div>
  );
}

interface CardContentProps {
  item: LearningModule;
  colors: CategoryColors;
  IconComponent: React.ComponentType<{ className?: string }>;
}


function CardContent({ item, colors, IconComponent }: CardContentProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="mb-8 transition-transform duration-500 hover:scale-110">
        <div
          className={`w-32 h-32 rounded-3xl ${colors.solid} flex items-center justify-center shadow-2xl`}
        >
          <IconComponent className="w-16 h-16 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-black text-gray-900 text-center mb-2">
        {item.title}
      </h2>

      <p className="text-base text-gray-600 font-medium text-center">
        {item.subtitle}
      </p>
    </div>
  );
}


function ExploreMoreButton({ onFlip }: { onFlip: () => void }) {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); 
          onFlip();
        }}
        className="flex items-center justify-center space-x-3
                   text-gray-500 hover:text-gray-900 transition-colors"
      >
        <span className="text-sm font-bold uppercase tracking-wider">
          Explore More
        </span>
        <FaChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}


function CardHeader({
  item,
  colors,
}: {
  item: LearningModule;
  colors: CategoryColors;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`px-6 py-2 ${colors.solid} rounded-full shadow-lg`}>
          <span className="text-xs font-black text-white tracking-widest">
            MODULE {item.num}
          </span>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.solid} shadow-lg`}
        >
          <span className="text-lg font-black text-white">{item.num}</span>
        </div>
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-3">{item.title}</h3>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-700 font-bold uppercase tracking-widest">
          What You'll Learn:
        </span>
        <div className={`flex-1 h-1 ${colors.solid} rounded-full`}></div>
      </div>
    </div>
  );
}

function PointsList({
  points,
  colors,
}: {
  points: string[];
  colors: CategoryColors;
}) {
  return (
    <div className="flex-grow space-y-4 overflow-y-auto pr-2">
      {points.map((point, index) => (
        <div key={index} className="flex items-start gap-4 group/item">
          <div className="flex-shrink-0 mt-1">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.solid} shadow-lg transition-all duration-300 group-hover/item:scale-110`}
            >
              <FaCheck className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
          </div>
          <div className="flex-1 pt-2">
            <span className="text-gray-900 font-bold text-lg leading-relaxed">
              {point}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BackButton({ onBackClick }: { onBackClick: () => void }) {
  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onBackClick();
        }}
        className="flex items-center justify-center space-x-3 text-gray-500 hover:text-gray-900 transition-colors duration-300 w-full"
      >
        <FaChevronLeft className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-bold uppercase tracking-wider">
          Back to Overview
        </span>
      </button>
    </div>
  );
}
