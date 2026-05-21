export const getColorClasses = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'indigo': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
    case 'green': return 'bg-green-50 border-green-200 text-green-700';
    case 'emerald': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    case 'teal': return 'bg-teal-50 border-teal-200 text-teal-700';
    case 'purple': return 'bg-purple-50 border-purple-200 text-purple-700';
    case 'violet': return 'bg-violet-50 border-violet-200 text-violet-700';
    case 'fuchsia': return 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700';
    case 'pink': return 'bg-pink-50 border-pink-200 text-pink-700';
    case 'rose': return 'bg-rose-50 border-rose-200 text-rose-700';
    case 'red': return 'bg-red-50 border-red-200 text-red-700';
    case 'orange': return 'bg-orange-50 border-orange-200 text-orange-700';
    case 'amber': return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'cyan': return 'bg-cyan-50 border-cyan-200 text-cyan-700';
    case 'lime': return 'bg-lime-50 border-lime-200 text-lime-700';
    default: return 'bg-gray-50 border-gray-200 text-gray-700';
  }
};

export const getDotColor = (colorClass: string) => {
  if (colorClass.includes('blue')) return 'text-blue-500';
  if (colorClass.includes('indigo')) return 'text-indigo-500';
  if (colorClass.includes('green')) return 'text-green-500';
  if (colorClass.includes('emerald')) return 'text-emerald-500';
  if (colorClass.includes('teal')) return 'text-teal-500';
  if (colorClass.includes('purple')) return 'text-purple-500';
  if (colorClass.includes('violet')) return 'text-violet-500';
  if (colorClass.includes('pink')) return 'text-pink-500';
  if (colorClass.includes('rose')) return 'text-rose-500';
  if (colorClass.includes('red')) return 'text-red-500';
  if (colorClass.includes('orange')) return 'text-orange-500';
  if (colorClass.includes('amber')) return 'text-amber-500';
  return 'text-gray-500';
};