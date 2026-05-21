"use client";

import dynamic from "next/dynamic";

const ParticleBackground = dynamic(
  () => import("./ParticleBackground"),
  {
    ssr: false,
    loading: () => null
  }
);

export default function ParticleClient() {
  return <ParticleBackground />;
}
