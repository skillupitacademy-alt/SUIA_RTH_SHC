export interface ExperimentAssignment {
  experimentId: string;
  variant: "control" | "variant_a" | "variant_b";
}

export function assignExperiment(experimentId: string, anonymousId: string): ExperimentAssignment {
  const bucket = anonymousId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
  const variant = bucket < 34 ? "control" : bucket < 67 ? "variant_a" : "variant_b";
  return { experimentId, variant };
}

