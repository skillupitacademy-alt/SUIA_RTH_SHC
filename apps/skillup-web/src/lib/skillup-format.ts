export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(`${value}T00:00:00`));
}

export function isPastDue(dueDate: string, reference = new Date()): boolean {
  return new Date(`${dueDate}T00:00:00`).getTime() < new Date(reference.toISOString().slice(0, 10) + 'T00:00:00').getTime();
}
