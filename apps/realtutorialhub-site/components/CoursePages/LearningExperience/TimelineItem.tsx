"use client";
import { iconMap } from "@/lib/CoursesCardData";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface TimelineItemProps {
  item: {
    id: number;
    icon: keyof typeof iconMap;
    title: string;
    description: string;
    highlight?: string;
    position: 'left' | 'right';
  };
  index: number;
}

export const TimelineItem = ({ item, index }: TimelineItemProps) => {
  const IconComponent = iconMap[item.icon];
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  // Determine if card is odd or even (0-indexed, so even = left, odd = right)
  const isEven = index % 2 === 0;
  
  return (
    <div ref={ref} className="relative flex justify-center mb-16 md:mb-20">
      {/* Desktop Timeline line connector - CENTERED */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-blue-400 via-blue-300 to-orange-300 hidden md:block">
        <motion.div
          className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-600 to-orange-500"
          initial={{ height: 0 }}
          animate={isInView ? { height: "100%" } : { height: 0 }}
          transition={{ duration: 1, delay: index * 0.2 }}
          style={{ originY: 0 }}
        />
      </div>
      
      {/* Mobile timeline line - LEFT SIDE */}

      
      {/* Timeline dot */}
      <motion.div
        className="absolute top-[50%] left-4 md:left-1/2 transform -translate-y-[50%] md:-translate-x-1/2 z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 15,
          delay: index * 0.3 
        }}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
          <span className="text-white font-bold text-sm md:text-base">{item.id}</span>
        </div>
      </motion.div>
      
      {/* Content Card */}
      <motion.div
        className={`
          w-full pl-12 md:pl-0
          ${isEven ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'}
          ${isEven ? 'md:mr-auto md:w-5/12' : 'md:ml-auto md:w-5/12'}
        `}
        initial={{ 
          opacity: 0, 
          x: isEven ? -50 : 50,
          y: 20 
        }}
        animate={isInView ? { 
          opacity: 1, 
          x: 0,
          y: 0 
        } : { 
          opacity: 0, 
          x: isEven ? -50 : 50,
          y: 20 
        }}
        transition={{ 
          duration: 0.6, 
          delay: index * 0.2 + 0.1,
          type: "spring",
          stiffness: 100
        }}
      >
        <div className={`
          bg-white rounded-2xl p-6 md:p-8 
          shadow-xl hover:shadow-2xl 
          border border-blue-100 hover:border-orange-300 
          transition-all duration-500 hover:-translate-y-1
          text-left md:text-inherit
          relative overflow-hidden
        `}>
          {/* Background shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-orange-50/20 to-blue-50/0"
            initial={{ x: "-100%" }}
            animate={isInView ? { x: "100%" } : { x: "-100%" }}
            transition={{ 
              duration: 1, 
              delay: index * 0.2 + 0.5,
              repeat: Infinity,
              repeatDelay: 3
            }}
          />
          
          {/* Desktop: Icon position based on even/odd */}
          <motion.div
            className={`
              hidden md:flex p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl 
              ${isEven ? 'float-right ml-4' : 'float-left mr-4'}
            `}
            initial={{ scale: 0, rotate: -180 }}
            animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: index * 0.2 + 0.4 
            }}
          >
            <IconComponent className="text-2xl text-white" />
          </motion.div>
          
          {/* Mobile: Icon at top left (always) */}
          <motion.div
            className="inline-flex md:hidden p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-4"
            initial={{ rotate: -90, opacity: 0 }}
            animate={isInView ? { rotate: 0, opacity: 1 } : { rotate: -90, opacity: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
          >
            <IconComponent className="text-2xl text-white" />
          </motion.div>
          
          <div className="relative z-10">
            {/* Title */}
            <motion.h3
              className="text-xl md:text-2xl font-bold text-gray-900 mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.2 + 0.5 }}
            >
              {item.title}
            </motion.h3>
            
            {/* Description */}
            <motion.p
              className="text-gray-600 text-base md:text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 + 0.7 }}
            >
              {item.description}
            </motion.p>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
};