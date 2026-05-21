export const formatStatValue = (
  value: number,
  format: 'number' | 'percentage' | 'range' | 'currency' = 'number',
  decimalPlaces: number = 0
): string => {
  switch (format) {
    case 'percentage':
      return `${value.toFixed(decimalPlaces)}%`;
    case 'range':
      const low = Math.floor(value * 0.85);
      const high = Math.floor(value * 1.18);
      return `${low} - ${high}`;
    case 'currency':
      return `₹${value.toFixed(decimalPlaces)} LPA`;
    default: // 'number'
      return `${Math.floor(value)}+`;
  }
};