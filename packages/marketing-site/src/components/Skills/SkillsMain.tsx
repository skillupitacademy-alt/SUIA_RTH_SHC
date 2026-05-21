
import SkillsMarquee from './SkillsMarquee';
import { SectionHeader } from '../CommonHeader/SectionHeader';
import { SECTION_CONFIG } from '@quiz/marketing-site/lib/SkillsData';

export default function SkillsMain() {
  return (
    <section className="py-12 lg:py-20" id="skills">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader title={SECTION_CONFIG.title} description={SECTION_CONFIG.description}
        />

        {/* Marquee Wrapper */}
        <div className="space-y-10">

          {/* ROW 1 */}
          <div className="relative">
            {/* LEFT BLUR – ONLY lg+ */}
            <div className="hidden lg:block pointer-events-none absolute left-0 top-0 h-full w-28
              bg-gradient-to-r from-white via-white/80 to-transparent z-10" />

            {/* RIGHT BLUR – ONLY lg+ */}
            <div className="hidden lg:block pointer-events-none absolute right-0 top-0 h-full w-28
              bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

            <SkillsMarquee direction="left" speed={35} />
          </div>

          {/* ROW 2 */}
          <div className="relative">
            {/* LEFT BLUR – ONLY lg+ */}
            <div className="hidden lg:block pointer-events-none absolute left-0 top-0 h-full w-28
              bg-gradient-to-r from-white via-white/80 to-transparent z-10" />

            {/* RIGHT BLUR – ONLY lg+ */}
            <div className="hidden lg:block pointer-events-none absolute right-0 top-0 h-full w-28
              bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

            <SkillsMarquee direction="right" speed={45} />
          </div>

        </div>
      </div>
    </section>
  );
}
