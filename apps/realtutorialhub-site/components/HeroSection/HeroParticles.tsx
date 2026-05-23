import React from "react";
import { ParticleConfig } from "@/lib/HeroSectionData";

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
  const particleStyle: React.CSSProperties & {
    "--end-x": string;
    "--end-y": string;
  } = {
    width: size,
    height: size,
    left: `${startX}%`,
    top: `${startY}%`,
    animation: `${FLOAT_ANIMATION} ${duration}s ease-in-out ${delay}s infinite`,
    "--end-x": `${endX}%`,
    "--end-y": `${endY}%`,
  };

  return (
    <div
      className="absolute rounded-full bg-white opacity-30"
      style={particleStyle}
    />
  );
};
