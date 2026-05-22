
import React from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  /**
   * @deprecated Section underlines now use the active brand primary color.
   */
  accentGradient?: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";

  /* animation (optional, keeps AOS support) */
  aos?: boolean;
}

const SIZE_MAP = {
  sm: "text-3xl md:text-4xl",
  md: "text-4xl lg:text-5xl",
  lg: "text-5xl xl:text-6xl"
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  textColor = "#4B49AC",
  size = "md",
  aos = false
}) => {
  return (
    <div
      className="text-center mb-16 max-w-4xl mx-auto"
      {...(aos && {
        "data-aos": "fade-up",
        "data-aos-duration": "800"
      })}
    >
      <h2
        className={`${SIZE_MAP[size]} font-bold mb-4`}
        style={{ color: textColor }}
      >
        {title}
      </h2>

      {/* Animated underline */}
      <div className="flex justify-center mb-8 overflow-hidden">
        <div
          className="h-1.5 w-32 rounded-full"
          {...(aos && {
            "data-aos": "slide-right",
            "data-aos-duration": "600",
            "data-aos-delay": "200"
          })}
          style={{
            backgroundColor: "var(--brand-primary)",
            animation: "underlineGrow 0.8s ease-out forwards",
            transformOrigin: "left center"
          }}
        />
      </div>

      {description && (
        <p
          className="text-lg lg:text-xl text-gray-600 leading-relaxed"
          {...(aos && {
            "data-aos": "fade-up",
            "data-aos-delay": "300",
            "data-aos-duration": "800"
          })}
        >
          {description}
        </p>
      )}
    </div>
  );
};
