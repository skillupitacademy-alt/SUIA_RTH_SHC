"use client";

import { useEffect, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

const ParticleBackground = () => {
  const isTouchDevice =
    typeof window !== "undefined" && "ontouchstart" in window;

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).catch(console.error);
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      background: { color: { value: "transparent" } },
      fpsLimit: 50,
      interactivity: {
        events: {
          onHover: {
            enable: !isTouchDevice,
            mode: "repulse",
          },
        },
      },
      particles: {
        color: { value: ["#3b82f6", "#f97316"] },
        links: {
          color: "#3b82f6",
          distance: 150,
          enable: true,
          opacity: 0.3,
          width: 1,
        },
        collisions: { enable: true },
        move: {
          enable: true,
          speed: 1,
          outModes: { default: "bounce" },
        },
        number: {
          density: { enable: true, area: 800 },
          value: 70,
        },
        opacity: { value: 0.6 },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 } },
      },
      detectRetina: true,
    }),
    [isTouchDevice]
  );

  return (
    <Particles
      id="tsparticles"
      options={options}
      className="fixed inset-0 -z-10"
    />
  );
};

export default ParticleBackground;
