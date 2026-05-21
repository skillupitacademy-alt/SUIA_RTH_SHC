// HeroText.tsx (SERVER)
import { HERO_SLIDES } from "@/lib/HeroSectionData";

export default function HeroText({ index = 0 }: { index?: number }) {
  const slide = HERO_SLIDES[index];

  return (
    <>
      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center md:text-left">
        {slide.title}
      </h1>

      <p className="mt-4 mb-8 text-[12px] md:text-xl text-white/95 text-center md:text-left">
        {slide.subtitle}
      </p>
    </>
  );
}
