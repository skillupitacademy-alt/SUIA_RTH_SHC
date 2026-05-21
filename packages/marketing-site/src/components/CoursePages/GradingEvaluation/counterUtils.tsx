export const formatCounterValue = (
  value: number,
  format: 'percentage' | 'fixed' = 'percentage',
  decimalPlaces: number = 0
): string => {
  const roundedValue = format === 'percentage' 
    ? value 
    : Math.floor(value);

  if (format === 'percentage') {
    return `${roundedValue.toFixed(decimalPlaces)}%`;
  }
  
  return `${roundedValue}`;
};

export const getCardColor = (id: number): string => {
  return id % 2 === 0 ? 'text-blue-600' : 'text-orange-500';
};

export const getAOSDelay = (id: number): number => {
  return id * 120;
};