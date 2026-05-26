export function buildSimpleEmbedding(values: number[]) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
  return values.map((value) => Number((value / magnitude).toFixed(6)));
}

