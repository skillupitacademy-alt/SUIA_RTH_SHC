import React from 'react';
import {
  BookOpen,
  Target,
  Lightbulb,
  Route,
  Code,
  Layers,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Rocket,
  Wrench,
  Globe,
  Zap,
  Star,
  Box,
} from 'lucide-react';
import type { IIntroductionBlock, BlockComponentProps, DomainTheme } from '../types';
import type { IntroductionIconKey } from '@quiz/types';
import { getThemeColor, withAlpha } from '../theme-utils';
import { BlockShell, StepBadge, TerminalWindow, CardSurface, CalloutBanner } from '../primitives';

/**
 * Introduction Block - Version Router
 * Routes to version-specific implementation based on block.version
 *
 * Note: Router-level validation ensures block.version === 'I1' and theme is present.
 */
export function IntroductionBlock({
  block,
  className = '',
  theme,
  runtimeContext,
}: BlockComponentProps<IIntroductionBlock>) {
  // Router guarantees version is 'I1' - simplified routing
  switch (block.version) {
    case 'I1':
      return <IntroductionI1View block={block} theme={theme!} className={className} runtimeContext={runtimeContext} />;
    default:
      // TypeScript exhaustiveness check (should never execute due to router validation)
      const _exhaustive: never = block.version;
      return null;
  }
}

/**
 * Icon Registry Mapper
 * Maps I1 icon keys to Lucide React components
 */
const ICON_REGISTRY: Record<IntroductionIconKey, React.ComponentType<{ className?: string }>> = {
  'book-open': BookOpen,
  'target': Target,
  'lightbulb': Lightbulb,
  'route': Route,
  'code': Code,
  'layers': Layers,
  'check-circle': CheckCircle,
  'arrow-right': ArrowRight,
  'graduation-cap': GraduationCap,
  'rocket': Rocket,
  'wrench': Wrench,
  'globe': Globe,
  'zap': Zap,
  'star': Star,
  'box': Box,
};

function getIcon(iconKey: IntroductionIconKey): React.ComponentType<{ className?: string }> {
  return ICON_REGISTRY[iconKey] || Box;
}

/**
 * Introduction I1 View - CANONICAL LOCKED UI
 * 
 * This is the single authoritative Introduction I1 renderer for ALL brands.
 * Composes UBA primitives: BlockShell, StepBadge, TerminalWindow, CardSurface, CalloutBanner.
 * Only theme.primary and theme.secondary vary by brand.
 * 
 * 9-section structure:
 * 1. Hero (badge, title, subtitle, motto with mountain illustration)
 * 2. Learning Goal
 * 3. The Topic
 * 4. Where Does It Fit? (flow cards)
 * 5. The Solution (code example with TerminalWindow)
 * 6. Where Is It Used? (use cases with CardSurface)
 * 7. What Will You Learn? (roadmap)
 * 8. Why This Matters (benefits with CardSurface)
 * 9. Key Takeaway (CalloutBanner)
 */
function IntroductionI1View({
  block,
  theme,
  className = '',
  runtimeContext,
}: {
  block: IIntroductionBlock;
  theme: DomainTheme; // Router guarantees theme is present
  className?: string;
  runtimeContext?: BlockComponentProps<IIntroductionBlock>['runtimeContext'];
}) {
  const page = block.content.page;

  // Router guarantees theme.primary and theme.secondary exist
  const primary = theme.primary;
  const secondary = theme.secondary;

  // UBRC: Use runtimeContext if available, fallback to block fields
  const blockId = runtimeContext?.blockId ?? block.id;
  const blockType = runtimeContext?.blockType ?? 'introduction';
  const blockVersion = runtimeContext?.blockVersion ?? block.version;

  return (
    <BlockShell
      className={className}
      theme={theme}
      runtimeContext={runtimeContext}
      blockId={blockId}
      blockType={blockType}
      blockVersion={blockVersion}
    >
      {/* HERO SECTION */}
      <header className="mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Title Content */}
          <div className="lg:col-span-6 space-y-4">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold"
              style={{ color: primary, backgroundColor: withAlpha(primary, '14') }}
            >
              <BookOpen className="h-4 w-4" />
              <span>{page.badge}</span>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight"
              style={{ color: secondary }}
            >
              {page.title}
            </h1>

            <p
              className="text-sm sm:text-base leading-relaxed max-w-xl"
              style={{ color: `${secondary}cc` }}
            >
              {page.subtitle}
            </p>
          </div>

          {/* Right: Mountain Roadmap Illustration with Motto */}
          <div className="lg:col-span-6 relative flex justify-center">
            <div
              className="w-full max-w-[480px] h-[220px] rounded-3xl p-4 relative overflow-hidden shadow-sm border"
              style={{
                background: `linear-gradient(135deg, ${withAlpha(primary, '0d')}, ${withAlpha(primary, '1a')})`,
                borderColor: withAlpha(primary, '33'),
              }}
            >
              {/* Handwritten Motto */}
              <div className="absolute top-3 left-4 z-10">
                <div className="font-hand text-xl font-bold leading-tight" style={{ color: secondary, fontFamily: 'Caveat, cursive' }}>
                  {(page.motto?.lines ?? []).map((line: string, index: number) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < (page.motto?.lines.length ?? 0) - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Decorative Mountain SVG Background */}
              <svg viewBox="0 0 400 200" className="w-full h-full absolute inset-0 opacity-40">
                <path d="M120 200 L180 100 L240 200 Z" fill="currentColor" style={{ color: primary }} opacity="0.3" />
                <path d="M190 200 L280 60 L380 200 Z" fill="currentColor" style={{ color: primary }} opacity="0.4" />
                <path d="M250 200 L340 30 L400 200 Z" fill="currentColor" style={{ color: primary }} opacity="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* LEARNING GOAL */}
      <section className="mb-10">
        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: withAlpha(primary, '0d'), borderColor: withAlpha(primary, '33') }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Target className="h-6 w-6" style={{ color: primary }} />
            <h2 className="text-xl font-bold" style={{ color: secondary }}>
              Learning Goal
            </h2>
          </div>
          <p className="text-base leading-relaxed" style={{ color: secondary }}>
            {page.learningGoal}
          </p>
        </div>
      </section>

      {/* SECTION 1: THE TOPIC */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <StepBadge step={1} size="md" theme={theme} />
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: secondary }}>
            {page.topic.title}
          </h2>
        </div>
        <p className="text-base leading-relaxed mb-3" style={{ color: secondary }}>
          {page.topic.description}
        </p>
        <div
          className="rounded-2xl border p-5 sm:p-6 text-base font-semibold italic shadow-sm"
          style={{
            borderColor: withAlpha(primary, '25'),
            backgroundColor: withAlpha(primary, '06'),
            color: `${secondary}dd`,
          }}
        >
          "{page.topic.quote}"
        </div>
      </section>

      {/* SECTION 2: WHERE DOES IT FIT? */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <StepBadge step={2} size="md" theme={theme} />
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: secondary }}>
            {page.whereFit.title}
          </h2>
        </div>
        <p className="text-base leading-relaxed mb-4" style={{ color: secondary }}>
          {page.whereFit.description}
        </p>

        {/* Flow Cards Container */}
        <div className="flex flex-col lg:flex-row items-center gap-2">
          {page.whereFit.flowCards.map((card, index: number) => {
            const IconComponent = getIcon(card.icon);
            return (
              <React.Fragment key={index}>
                <div
                  className={`flex-1 w-full rounded-2xl p-4 text-center space-y-2 border-2 ${
                    card.highlight ? 'shadow-sm' : ''
                  }`}
                  style={
                    card.highlight
                      ? { borderColor: primary, backgroundColor: 'white' }
                      : { borderColor: getThemeColor(theme, 'gray', 200), backgroundColor: getThemeColor(theme, 'gray', 50) }
                  }
                >
                  <div className="h-10 flex items-center justify-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        card.highlight ? '' : 'bg-opacity-80'
                      }`}
                      style={{ backgroundColor: card.highlight ? withAlpha(primary, '14') : getThemeColor(theme, 'gray', 200), color: card.highlight ? primary : getThemeColor(theme, 'gray', 500) }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>
                  <h4
                    className="font-bold text-sm sm:text-base leading-snug"
                    style={{ color: card.highlight ? primary : secondary }}
                  >
                    {card.title}
                  </h4>
                  <p className="text-xs leading-tight" style={{ color: getThemeColor(theme, 'gray', 500) }}>
                    {card.subtitle}
                  </p>
                </div>
                {index < page.whereFit.flowCards.length - 1 && (
                  <div className="flex items-center justify-center text-lg" style={{ color: primary }}>
                    <ArrowRight className="hidden lg:block h-5 w-5" />
                    <div className="block lg:hidden">
                      <ArrowRight className="h-5 w-5 rotate-90" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: THE SOLUTION */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <StepBadge step={3} size="md" theme={theme} />
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: secondary }}>
            {page.solution.title}
          </h2>
        </div>
        <p className="text-base leading-relaxed mb-4" style={{ color: secondary }}>
          {page.solution.description}
        </p>

        {/* Code Editor Box with TerminalWindow primitive */}
        <TerminalWindow title={page.solution.code.language} copySource={page.solution.code.code} theme={theme}>
          <div className="bg-[#0B132B] dark:bg-slate-950 p-5 overflow-x-auto">
            <pre className="font-mono text-sm leading-relaxed text-slate-200">
              <code>{page.solution.code.code}</code>
            </pre>
          </div>
        </TerminalWindow>
      </section>

      {/* SECTION 4: WHERE IS IT USED? */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <StepBadge step={4} size="md" theme={theme} />
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: secondary }}>
            {page.whereUsed.title}
          </h2>
        </div>
        <p className="text-base leading-relaxed mb-4" style={{ color: secondary }}>
          {page.whereUsed.description}
        </p>

        {/* Use Cases Grid with CardSurface */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {page.whereUsed.useCases.map((useCase, index: number) => {
            const IconComponent = getIcon(useCase.icon);
            return (
              <CardSurface
                key={index}
                hoverable
                theme={theme}
                className="p-6 text-center space-y-3"
                style={
                  useCase.highlight
                    ? { backgroundColor: withAlpha(primary, '0d'), borderColor: withAlpha(primary, '33') }
                    : undefined
                }
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto shadow-sm"
                  style={{ backgroundColor: withAlpha(primary, '14'), color: primary }}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-lg" style={{ color: secondary }}>
                  {useCase.title}
                </h4>
                <p className="text-sm" style={{ color: getThemeColor(theme, 'gray', 500) }}>
                  {useCase.description}
                </p>
              </CardSurface>
            );
          })}
        </div>
      </section>

      {/* SECTION 5: WHAT WILL YOU LEARN? (ROADMAP) */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <StepBadge step={5} size="md" theme={theme} />
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: secondary }}>
            {page.roadmap.title}
          </h2>
        </div>
        <p className="text-base leading-relaxed mb-4" style={{ color: secondary }}>
          {page.roadmap.description}
        </p>

        {/* Roadmap Steps Flow */}
        <div className="flex flex-col lg:flex-row items-center gap-2 overflow-x-auto">
          {page.roadmap.steps.map((step, index: number) => (
            <React.Fragment key={index}>
              <div className="flex-1 w-full bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-center space-y-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-sm mx-auto"
                  style={{ backgroundColor: primary }}
                >
                  {index + 1}
                </div>
                <h4 className="font-bold text-xs sm:text-sm leading-snug" style={{ color: secondary }}>
                  {step.title}
                </h4>
                <p className="text-[11px] leading-tight" style={{ color: getThemeColor(theme, 'gray', 500) }}>
                  {step.subtitle}
                </p>
              </div>
              {index < page.roadmap.steps.length - 1 && (
                <div className="flex items-center justify-center" style={{ color: primary }}>
                  <ArrowRight className="hidden lg:block h-4 w-4" />
                  <div className="block lg:hidden">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* SECTION 6: WHY THIS MATTERS */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <StepBadge step={6} size="md" theme={theme} />
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: secondary }}>
            {page.whyMatters.title}
          </h2>
        </div>

        {/* Benefits Grid with CardSurface */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {page.whyMatters.benefits.map((benefit, index: number) => {
            const IconComponent = getIcon(benefit.icon);
            return (
              <CardSurface
                key={index}
                hoverable
                theme={theme}
                className="p-5 text-center space-y-3"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: withAlpha(primary, '14'), color: primary }}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-base leading-snug" style={{ color: secondary }}>
                  {benefit.title}
                </h4>
                <p className="text-sm" style={{ color: getThemeColor(theme, 'gray', 500) }}>
                  {benefit.subtitle}
                </p>
              </CardSurface>
            );
          })}
        </div>
      </section>

      {/* KEY TAKEAWAY with CalloutBanner primitive */}
      <CalloutBanner
        variant="takeaway"
        theme={theme}
        title="Key Takeaway"
        className="rounded-xl p-6"
      >
        <p className="text-base leading-relaxed" style={{ color: secondary }}>
          {page.keyTakeaway}
        </p>
      </CalloutBanner>
    </BlockShell>
  );
}
