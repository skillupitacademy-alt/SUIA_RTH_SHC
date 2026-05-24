// HeroText.tsx (SERVER)
import { HERO_SLIDES } from "@quiz/marketing-site/lib/HeroSectionData";

export default function HeroText({ index = 0 }: { index?: number }) {
  const slide = HERO_SLIDES[index];

  return (
    <>
      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-center md:text-left">
        {(() => {
          const words = slide.title.split(" ");
          const mid = Math.ceil(words.length / 2);
          return (
            <>
              <span style={{ color: "var(--brand-primary)" }}>
                {words.slice(0, mid).join(" ")}
              </span>
              {" "}
              <span style={{ color: "var(--brand-secondary)" }}>
                {words.slice(mid).join(" ")}
              </span>
            </>
          );
        })()}
      </h1>

      <p className="mt-4 mb-8 text-[12px] md:text-xl opacity-90 text-center md:text-left text-[var(--brand-secondary)] font-medium">
        {slide.subtitle}
      </p>
    </>
  );
}
