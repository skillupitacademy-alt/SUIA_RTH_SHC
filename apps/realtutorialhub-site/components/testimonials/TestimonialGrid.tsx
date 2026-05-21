"use client";
import { motion, Variants } from "framer-motion";
import React from 'react';
import TestimonialCard from './TestimonialCard';
import { Testimonial } from '@/lib/Testimonial';

interface TestimonialGridProps {
  testimonials: Testimonial[];
}

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};



const TestimonialGrid: React.FC<TestimonialGridProps> = ({ testimonials }) => {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      variants={gridVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {testimonials.map((testimonial, index) => (
        <motion.div
          key={testimonial.id}
          variants={cardVariants}
        >
          <TestimonialCard
            testimonial={testimonial}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TestimonialGrid;


