"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import WhyUsCard from "./WhyUsCard";
import { WHY_US_CARDS, SECTION_CONFIG } from "@quiz/marketing-site/lib/WhyUsData";
import { SectionHeader } from "../CommonHeader/SectionHeader";

const WhyUsMain: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);

  return (
    <section
      id="whyUs"
      ref={sectionRef}
      className="relative py-20 font-montserrat scroll-mt-24 lg:scroll-mt-28"
    >
      <div className="mt-10 w-full max-w-screen-xl mx-auto px-6 lg:px-8 xl:px-12">
        <SectionHeader
          title={SECTION_CONFIG.title}
          description={SECTION_CONFIG.description}
        />

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
        >
          {WHY_US_CARDS.map((card) => (
            <WhyUsCard key={card.id} card={card} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyUsMain;
