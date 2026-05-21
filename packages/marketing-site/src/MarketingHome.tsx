import { LazySection } from "@quiz/marketing-site/components/LazySection";
import { ErrorBoundary } from "@quiz/marketing-site/components/ErrorBoundary";

import HeroText from "@quiz/marketing-site/components/HeroSection/HeroText";
import HeroClient from "@quiz/marketing-site/components/HeroSection/HeroClient";

import WhyUsMain from "@quiz/marketing-site/components/WhyUs/WhyUsMain";
import WhyUsSkeleton from "@quiz/marketing-site/components/WhyUs/WhyUsSkeleton";

import CourseCard from "@quiz/marketing-site/components/CourseCards/CourseCards";
import CourseCardsSkeleton from "@quiz/marketing-site/components/CourseCards/CourseCardsSkeleton";

import LearningPath from "@quiz/marketing-site/components/LearningPath/LearningPath";
import LearningPathSkeleton from "@quiz/marketing-site/components/LearningPath/LearningPathSkeleton";

import SkillsMain from "@quiz/marketing-site/components/Skills/SkillsMain";
import SkillsMainSkeleton from "@quiz/marketing-site/components/Skills/SkillsMainSkeleton";

import Testimonial from "@quiz/marketing-site/components/testimonials/Testimonial";
import TestimonialSkeleton from "@quiz/marketing-site/components/testimonials/TestimonialsSkeleton";

import ContactUs from "@quiz/marketing-site/components/contact/ContactUs";
import ContactSkeleton from "@quiz/marketing-site/components/contact/ContactSkeleton";

import Footer from "@quiz/marketing-site/components/footer/Footer";
import FooterSkeleton from "@quiz/marketing-site/components/footer/FooterSkeleton";
import NavbarWrapper from "@quiz/marketing-site/components/NavBar/NavbarWrapper";

import ParticleClient from "@quiz/marketing-site/components/Particles/ParticleClient";

export default function MarketingHome() {
  return (
    <div className="relative overflow-hidden">
      <ParticleClient />

      <NavbarWrapper />
      <HeroClient>
        <HeroText />
      </HeroClient>

      <section id="why-us">
        <LazySection skeleton={<WhyUsSkeleton />} delay={900}>
          <WhyUsMain />
        </LazySection>
      </section>

      <section id="courses">
        <LazySection skeleton={<CourseCardsSkeleton />} delay={800}>
          <ErrorBoundary fallback={<CourseCardsSkeleton />}>
            <CourseCard />
          </ErrorBoundary>
        </LazySection>
      </section>

      <section id="learning-path">
        <LazySection skeleton={<LearningPathSkeleton />} delay={1000}>
          <ErrorBoundary fallback={<LearningPathSkeleton />}>
            <LearningPath />
          </ErrorBoundary>
        </LazySection>
      </section>

      <section id="skills">
        <LazySection skeleton={<SkillsMainSkeleton />} delay={1200}>
          <SkillsMain />
        </LazySection>
      </section>

      <section id="testimonials">
        <LazySection skeleton={<TestimonialSkeleton />} delay={1400}>
          <Testimonial />
        </LazySection>
      </section>

      <section id="contact">
        <LazySection skeleton={<ContactSkeleton />} delay={1600}>
          <ErrorBoundary fallback={<ContactSkeleton />}>
            <ContactUs />
          </ErrorBoundary>
        </LazySection>
      </section>

      <section id="footer">
        <LazySection skeleton={<FooterSkeleton />} delay={1800}>
          <Footer />
        </LazySection>
      </section>
    </div>
  );
}
