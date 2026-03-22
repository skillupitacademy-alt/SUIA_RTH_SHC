import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateInput: string | Date | null | undefined): string {
    if (!dateInput) return 'Recently';
    
    try {
        const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
        if (!isValid(date)) return 'Recently';
        return formatDistanceToNow(date, { addSuffix: true });
    } catch {
        return 'Recently';
    }
}
