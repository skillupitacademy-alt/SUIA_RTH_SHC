export function detectAnomaly(input: { current: number; baseline: number; tolerance?: number }) {
  const tolerance = input.tolerance ?? 0.3;
  if (input.baseline === 0) {
    return { anomalous: input.current > 0, deviation: input.current };
  }

  const deviation = Math.abs(input.current - input.baseline) / input.baseline;
  return {
    anomalous: deviation > tolerance,
    deviation,
  };
}

