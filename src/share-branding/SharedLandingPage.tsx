'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Check,
  FileCheck,
  FileEdit,
  GraduationCap,
  Lightbulb,
  Menu,
  MessageSquare,
  Rocket,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';

import type {
  BrandJourneyStep,
  BrandMethodCard,
  BrandPricingPlan,
  BrandProjectCard,
  BrandTestimonial,
  SharedBrandDefinition,
} from '@quiz/config/src/brands';

const comparisonIcons = {
  shared: Check,
  missing: X,
} as const;

function sectionHeadingStyle() {
  return { fontFamily: "'Poppins', 'Outfit', system-ui, sans-serif" };
}

function bodyStyle() {
  return { fontFamily: "'Inter', system-ui, sans-serif" };
}

function gradientBackground(brand: SharedBrandDefinition) {
  return {
    background: `
      radial-gradient(circle at top, ${brand.secondaryColor}18, transparent 28%),
      radial-gradient(circle at 20% 10%, ${brand.primaryColor}14, transparent 22%),
      linear-gradient(180deg, #ffffff 0%, #f7f8fc 100%)
    `,
  };
}

export function SharedLandingPage({
  brand,
  startLearningHref,
  loginHref,
}: {
  brand: SharedBrandDefinition;
  startLearningHref: string;
  loginHref: string;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const heroPills = useMemo(() => brand.heroBadges.slice(0, 5), [brand.heroBadges]);

  return (
    <div className="min-h-screen text-slate-950" style={gradientBackground(brand)}>
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
              style={{ backgroundColor: brand.secondaryColor }}
            >
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">{brand.navLabel}</p>
              <p className="text-lg font-black tracking-tight">{brand.brandName}</p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 min-[901px]:flex">
            <a href="#solutions" className="text-sm font-bold text-slate-600 transition hover:text-slate-950">Solutions</a>
            <a href="#journey" className="text-sm font-bold text-slate-600 transition hover:text-slate-950">Journey</a>
            <a href="#pricing" className="text-sm font-bold text-slate-600 transition hover:text-slate-950">Pricing</a>
            <a href="#stories" className="text-sm font-bold text-slate-600 transition hover:text-slate-950">Stories</a>
          </div>

          <div className="hidden items-center gap-3 min-[901px]:flex">
            <Link href={loginHref} className="rounded-full px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
              Log In
            </Link>
            <Link
              href={startLearningHref}
              className="rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Start Learning
            </Link>
          </div>

          <button
            type="button"
            className="rounded-xl p-2 text-slate-700 transition hover:bg-slate-100 min-[901px]:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-4 min-[901px]:hidden">
            <div className="flex flex-col gap-2">
              <a href="#solutions" className="rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Solutions</a>
              <a href="#journey" className="rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Journey</a>
              <a href="#pricing" className="rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Pricing</a>
              <a href="#stories" className="rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Stories</a>
              <div className="mt-2 grid gap-2">
                <Link href={loginHref} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-800">
                  Log In
                </Link>
                <Link
                  href={startLearningHref}
                  className="rounded-xl px-3 py-3 text-center text-sm font-bold text-white"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  Start Learning
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </nav>

      <main className="overflow-hidden">
        <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col items-center justify-center px-4 py-14 text-center md:px-6 lg:py-20">
          <div className="max-w-5xl">
            <p className="text-xs font-black uppercase tracking-[0.45em]" style={{ color: brand.primaryColor }}>
              {brand.brandName}
            </p>
            <h1 className="mt-6 text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl" style={sectionHeadingStyle()}>
              <span style={{ color: brand.primaryColor }}>{brand.heroHeadingLine1}</span>
              <br />
              <span style={{ color: brand.secondaryColor }}>{brand.heroHeadingLine2}</span>
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-600" style={bodyStyle()}>
              {brand.heroCopy}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {heroPills.map((pill, index) => (
                <span
                  key={pill}
                  className="rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.28em]"
                  style={{
                    backgroundColor: index === 0 ? brand.primaryColor : '#ffffff',
                    color: index === 0 ? '#ffffff' : brand.secondaryColor,
                    borderColor: index === 0 ? brand.primaryColor : `${brand.secondaryColor}20`,
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href={startLearningHref}
                className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-bold text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] transition hover:-translate-y-1"
                style={{ backgroundColor: brand.primaryColor }}
              >
                Start Learning
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-800 shadow-[0_16px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-1"
              >
                Explore Courses
              </a>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 rounded-[2rem] border border-white/70 bg-white/80 px-6 py-5 shadow-[0_24px_64px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <MetaBadge icon={<Briefcase className="h-5 w-5 text-blue-600" />} text="Internship" />
            <MetaDivider />
            <MetaBadge icon={<FileCheck className="h-5 w-5 text-emerald-600" />} text="Experience Letter" />
            <MetaDivider />
            <MetaBadge icon={<Rocket className="h-5 w-5 text-violet-600" />} text="Placement" />
          </div>

          <div className="mt-12 grid w-full gap-4 md:grid-cols-3">
            {brand.heroStats.map((stat) => (
              <div key={stat.label} className="rounded-[2rem] border border-white/70 bg-white/80 p-6 text-left shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">{stat.label}</p>
                <p className="mt-4 text-4xl font-black tracking-tight text-slate-950" style={sectionHeadingStyle()}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <SectionShell id="solutions" title="Learning online often feels confusing and directionless." copy="The shared UX stays identical, but the content emphasis adapts to the brand so learners always see the right message in the same visual system.">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {brand.featureCards.map((card, index) => (
              <FeatureCard
                key={card.title}
                title={card.title}
                description={card.description}
                icon={featureIconAt(index)}
              />
            ))}
          </div>
        </SectionShell>

        <SectionShell id="journey" title="Your complete learning journey." copy="One shared experience takes the learner from understanding to improvement without changing the page language between brands.">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] lg:p-10">
            <div className="grid gap-4 md:grid-cols-5">
              {brand.journeySteps.map((step) => (
                <JourneyStepCard key={step.title} step={step} />
              ))}
            </div>
          </div>
        </SectionShell>

        <SectionShell title="How the structured system works." copy="The imported design language stays intact here, while each brand injects only its own approved content and emphasis.">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {brand.methodCards.map((card) => (
              <MethodCard key={card.title} card={card} brand={brand} />
            ))}
          </div>
        </SectionShell>

        <SectionShell title={brand.tutorHeading} copy={brand.tutorCopy}>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-black uppercase tracking-[0.35em]" style={{ color: brand.primaryColor }}>
                {brand.tutorBadge}
              </p>
              <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-950" style={sectionHeadingStyle()}>
                Guided support without breaking the learning flow
              </h3>
              <p className="mt-4 text-base leading-8 text-slate-600" style={bodyStyle()}>
                {brand.tutorCopy}
              </p>
              <Link
                href={startLearningHref}
                className="mt-8 inline-flex items-center rounded-full px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
                style={{ backgroundColor: brand.secondaryColor }}
              >
                Start Learning
              </Link>
            </div>

            <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl p-3" style={{ backgroundColor: `${brand.primaryColor}33` }}>
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Context response</p>
                  <p className="mt-1 text-lg font-black">{brand.tutorBadge}</p>
                </div>
              </div>
              <p className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 text-base leading-8 text-slate-100" style={bodyStyle()}>
                {brand.tutorResponse}
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.28em] text-slate-300">
                <span className="rounded-full border border-white/10 px-4 py-2">Shared engine</span>
                <span className="rounded-full border border-white/10 px-4 py-2">Brand aware</span>
                <span className="rounded-full border border-white/10 px-4 py-2">Guided path</span>
              </div>
            </div>
          </div>
        </SectionShell>

        <SectionShell title={brand.comparisonTitle} copy={brand.comparisonCopy}>
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] lg:p-8">
            <div className="grid grid-cols-[1.6fr_repeat(3,0.55fr)] items-center gap-3 border-b border-slate-100 pb-4 text-center text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              <span className="text-left">Capability</span>
              <span className="rounded-full px-3 py-2 text-white" style={{ backgroundColor: brand.secondaryColor }}>Us</span>
              <span>Generic 1</span>
              <span>Generic 2</span>
            </div>
            <div className="mt-3">
              {brand.comparisonRows.map((row) => (
                <ComparisonRow key={row.label} row={row} />
              ))}
            </div>
          </div>
        </SectionShell>

        <SectionShell title="Shared engine, brand-specific outcomes." copy="The overall experience remains the same, while the examples and emphasis stay aligned to the brand identity configured in the shared definition layer.">
          <div className="grid gap-6 lg:grid-cols-3">
            {brand.projectCards.map((project, index) => (
              <ProjectCard key={project.title} project={project} brand={brand} index={index} />
            ))}
          </div>
        </SectionShell>

        <SectionShell id="pricing" title="Pricing and progression." copy="The framework remains shared, while plan language and callouts stay controlled through brand definitions.">
          <div className="grid gap-6 lg:grid-cols-2">
            {brand.pricingPlans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} brand={brand} startLearningHref={startLearningHref} />
            ))}
          </div>
        </SectionShell>

        <SectionShell id="stories" title="Learner stories." copy="The typography, spacing, and surface treatment stay fixed while testimonials and role labels remain brand-specific.">
          <div className="grid gap-6 lg:grid-cols-3">
            {brand.testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.name} testimonial={testimonial} />
            ))}
          </div>
        </SectionShell>

        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:py-20">
          <div className="rounded-[2.75rem] px-6 py-10 text-center text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] lg:px-12 lg:py-16" style={{ backgroundColor: brand.secondaryColor }}>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={sectionHeadingStyle()}>
              Start your structured learning journey today.
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/88" style={bodyStyle()}>
              Enter the shared engine surface with the correct brand identity attached so the experience stays consistent from landing page to login to dashboard.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href={startLearningHref} className="rounded-full bg-white px-8 py-4 text-base font-bold text-slate-950 transition hover:-translate-y-0.5">
                Start Learning
              </Link>
              <a href="#pricing" className="rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white transition hover:-translate-y-0.5">
                View All Courses
              </a>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm font-black uppercase tracking-[0.28em] text-white/76">
              <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> Guided system</span>
              <span className="inline-flex items-center gap-2"><Star className="h-4 w-4" /> Shared UX</span>
              <span className="inline-flex items-center gap-2"><Award className="h-4 w-4" /> Brand-specific content</span>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
            <div className="grid gap-10 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: brand.secondaryColor }}>
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-black tracking-tight" style={sectionHeadingStyle()}>{brand.brandName}</span>
                </div>
                <p className="mt-5 text-sm font-bold leading-7 text-slate-500" style={bodyStyle()}>
                  {brand.footerCopy}
                </p>
              </div>
              <FooterColumn title="Product" items={['Solutions', 'Journey', 'Pricing', 'Stories']} />
              <FooterColumn title="Company" items={['About', 'Blog', 'Careers', 'Contact']} />
              <FooterColumn title="Legal" items={['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security']} />
            </div>
            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 text-sm font-bold text-slate-400 md:flex-row">
              <p>{brand.footerCopyright}</p>
              <div className="flex gap-4">
                <div className="h-3 w-3 rounded-full bg-slate-200" />
                <div className="h-3 w-3 rounded-full bg-slate-200" />
                <div className="h-3 w-3 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function SectionShell({
  children,
  copy,
  id,
  title,
}: {
  children: ReactNode;
  copy: string;
  id?: string;
  title: string;
}) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:py-20">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl" style={sectionHeadingStyle()}>
          {title}
        </h2>
        <p className="mt-5 text-lg leading-8 text-slate-600" style={bodyStyle()}>
          {copy}
        </p>
      </div>
      {children}
    </section>
  );
}

function MetaBadge({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-slate-50 p-3">{icon}</div>
      <span className="text-sm font-black uppercase tracking-[0.28em] text-slate-700">{text}</span>
    </div>
  );
}

function MetaDivider() {
  return <div className="hidden h-8 w-px bg-slate-200 md:block" />;
}

function featureIconAt(index: number) {
  const icons = [
    <Lightbulb key="light" className="h-8 w-8 text-rose-500" />,
    <Target key="target" className="h-8 w-8 text-orange-500" />,
    <MessageSquare key="message" className="h-8 w-8 text-amber-500" />,
    <TrendingUp key="trend" className="h-8 w-8 text-sky-500" />,
  ];

  return icons[index] ?? <BookOpen className="h-8 w-8 text-slate-500" />;
}

function FeatureCard({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 text-center shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:-translate-y-1">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
        {icon}
      </div>
      <h3 className="mt-6 text-xl font-black tracking-tight text-slate-950" style={sectionHeadingStyle()}>
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600" style={bodyStyle()}>
        {description}
      </p>
    </div>
  );
}

function JourneyStepCard({ step }: { step: BrandJourneyStep }) {
  return (
    <div
      className="rounded-[2rem] p-6 text-center text-white shadow-[0_16px_40px_rgba(15,23,42,0.12)] transition hover:-translate-y-1"
      style={{ backgroundColor: step.accent }}
    >
      <p className="text-lg font-black tracking-tight" style={sectionHeadingStyle()}>
        {step.title}
      </p>
    </div>
  );
}

function MethodCard({
  brand,
  card,
}: {
  brand: SharedBrandDefinition;
  card: BrandMethodCard;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_18px_44px_rgba(15,23,42,0.08)] transition hover:-translate-y-1">
      <p className="text-xs font-black uppercase tracking-[0.35em]" style={{ color: brand.primaryColor }}>
        {card.eyebrow}
      </p>
      <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950" style={sectionHeadingStyle()}>
        {card.title}
      </h3>
      <p className="mt-4 text-base leading-8 text-slate-600" style={bodyStyle()}>
        {card.description}
      </p>
    </div>
  );
}

function ComparisonRow({
  row,
}: {
  row: { label: string; shared: boolean; competitorOne: boolean; competitorTwo: boolean };
}) {
  return (
    <div className="grid grid-cols-[1.6fr_repeat(3,0.55fr)] items-center gap-3 border-b border-slate-50 py-4 text-center last:border-b-0">
      <p className="text-left text-sm font-bold leading-6 text-slate-700">{row.label}</p>
      <ComparisonMark active={row.shared} />
      <ComparisonMark active={row.competitorOne} />
      <ComparisonMark active={row.competitorTwo} />
    </div>
  );
}

function ComparisonMark({ active }: { active: boolean }) {
  const Icon = active ? comparisonIcons.shared : comparisonIcons.missing;

  return (
    <div className="flex justify-center">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full ${active ? 'bg-emerald-100' : 'bg-slate-100'}`}>
        <Icon className={`h-4 w-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
      </div>
    </div>
  );
}

function ProjectCard({
  brand,
  index,
  project,
}: {
  brand: SharedBrandDefinition;
  index: number;
  project: BrandProjectCard;
}) {
  const accents = [brand.primaryColor, brand.secondaryColor, brand.tertiaryColor];

  return (
    <div className="rounded-[2.25rem] border border-slate-200 bg-white p-8 shadow-[0_20px_54px_rgba(15,23,42,0.08)] transition hover:-translate-y-1">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-white shadow-[0_18px_36px_rgba(15,23,42,0.12)]"
        style={{ backgroundColor: accents[index % accents.length] }}
      >
        {index === 0 ? <FileEdit className="h-7 w-7" /> : index === 1 ? <Brain className="h-7 w-7" /> : <Zap className="h-7 w-7" />}
      </div>
      <h3 className="mt-6 text-2xl font-black tracking-tight text-slate-950" style={sectionHeadingStyle()}>
        {project.title}
      </h3>
      <p className="mt-4 text-base leading-8 text-slate-600" style={bodyStyle()}>
        {project.description}
      </p>
      <Link href="#" className="mt-8 inline-flex items-center text-sm font-bold" style={{ color: brand.secondaryColor }}>
        View Projects
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
}

function PricingCard({
  brand,
  plan,
  startLearningHref,
}: {
  brand: SharedBrandDefinition;
  plan: BrandPricingPlan;
  startLearningHref: string;
}) {
  const highlighted = plan.highlighted === true;

  return (
    <div
      className={`rounded-[2.5rem] p-8 shadow-[0_24px_64px_rgba(15,23,42,0.10)] transition hover:-translate-y-1 ${
        highlighted ? 'text-white' : 'border border-slate-200 bg-white text-slate-950'
      }`}
      style={highlighted ? { backgroundColor: brand.secondaryColor } : undefined}
    >
      <p className={`text-xs font-black uppercase tracking-[0.35em] ${highlighted ? 'text-white/70' : 'text-slate-400'}`}>{plan.name}</p>
      <h3 className="mt-4 text-5xl font-black tracking-tight" style={sectionHeadingStyle()}>
        {plan.priceLabel}
      </h3>
      <p className={`mt-4 text-base leading-8 ${highlighted ? 'text-white/85' : 'text-slate-600'}`} style={bodyStyle()}>
        {plan.summary}
      </p>
      <ul className="mt-8 space-y-4">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm font-bold leading-6">
            <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${highlighted ? 'bg-white/16' : 'bg-emerald-100'}`}>
              <Check className={`h-4 w-4 ${highlighted ? 'text-white' : 'text-emerald-600'}`} />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={startLearningHref}
        className={`mt-10 inline-flex rounded-full px-7 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${
          highlighted ? 'bg-white text-slate-950' : 'text-white'
        }`}
        style={highlighted ? undefined : { backgroundColor: brand.primaryColor }}
      >
        {plan.ctaLabel}
      </Link>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: BrandTestimonial }) {
  return (
    <div className="rounded-[2.25rem] border border-slate-200 bg-white p-8 shadow-[0_20px_54px_rgba(15,23,42,0.08)] transition hover:-translate-y-1">
      <div className="flex gap-1 text-amber-400">
        <Star className="h-5 w-5 fill-current" />
        <Star className="h-5 w-5 fill-current" />
        <Star className="h-5 w-5 fill-current" />
        <Star className="h-5 w-5 fill-current" />
        <Star className="h-5 w-5 fill-current" />
      </div>
      <p className="mt-6 text-lg leading-8 text-slate-600" style={bodyStyle()}>
        “{testimonial.quote}”
      </p>
      <div className="mt-8">
        <p className="text-lg font-black tracking-tight text-slate-950" style={sectionHeadingStyle()}>{testimonial.name}</p>
        <p className="mt-1 text-xs font-black uppercase tracking-[0.3em] text-slate-400">{testimonial.role}</p>
      </div>
    </div>
  );
}

function FooterColumn({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">{title}</p>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item}>
            <a href="#" className="text-sm font-bold text-slate-600 transition hover:text-slate-950">
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
