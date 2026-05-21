import React from "react";
import { ParticleConfig } from "@quiz/marketing-site/lib/HeroSectionData";

const FLOAT_ANIMATION = "floatParticle";

export const AnimatedParticle: React.FC<ParticleConfig> = ({
  delay,
  duration,
  startX,
  startY,
  endX,
  endY,
  size
}) => {
  return (
    <div
      className="absolute rounded-full bg-white opacity-30"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        top: `${startY}%`,
        animation: `${FLOAT_ANIMATION} ${duration}s ease-in-out ${delay}s infinite`,
        ["--end-x" as any]: `${endX}%`,
        ["--end-y" as any]: `${endY}%`
      }}
    />
  );
};
