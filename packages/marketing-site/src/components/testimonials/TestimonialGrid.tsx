"use client";
import { motion, Variants } from "framer-motion";
import React from 'react';
import TestimonialCard from './TestimonialCard';
import { Testimonial } from '@quiz/marketing-site/lib/Testimonial';

interface TestimonialGridProps {
  testimonials: Testimonial[];
}

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {testimonials.map((testimonial) => (
        <motion.div
          key={testimonial.id}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          <TestimonialCard testimonial={testimonial} />
        </motion.div>
      ))}
    </div>
  );
};

export default TestimonialGrid;
