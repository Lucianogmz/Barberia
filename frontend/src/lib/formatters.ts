/**
 * Utility functions for formatting dates and currency in Argentine locale.
 */

/**
 * Format a price in ARS (Argentine Pesos).
 * Example: 15000 → "$15.000"
 */
export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse a YYYY-MM-DD string to a Date in Argentina timezone.
 * This avoids the UTC midnight issue when the string is interpreted as UTC.
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid DST issues
}

/**
 * Format a date for display in Spanish (Argentina timezone).
 * Example: "martes, 6 de mayo de 2026"
 */
export function formatDateES(date: Date | string): string {
  const d = typeof date === 'string' && date.length === 10
    ? parseLocalDate(date)
    : typeof date === 'string'
      ? new Date(date)
      : date;
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

/**
 * Format a short date for display.
 * Example: "06/05/2026"
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' && date.length === 10
    ? parseLocalDate(date)
    : typeof date === 'string'
      ? new Date(date)
      : date;
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

/**
 * Format a time for display (Argentina timezone).
 * Example: "14:30"
 */
export function formatTimeES(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

/**
 * Format a time range.
 * Example: "14:30 — 15:00"
 */
export function formatTimeRange(start: Date | string, end: Date | string): string {
  return `${formatTimeES(start)} — ${formatTimeES(end)}`;
}

/**
 * Get a YYYY-MM-DD string from a Date (in Argentina timezone).
 */
export function toDateString(date: Date): string {
  const d = new Date(date.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Get today's date as YYYY-MM-DD string in Argentina timezone.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const argentinaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  return `${argentinaDate.getFullYear()}-${String(argentinaDate.getMonth() + 1).padStart(2, '0')}-${String(argentinaDate.getDate()).padStart(2, '0')}`;
}

/**
 * Get the Spanish month name.
 */
export function getMonthNameES(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return months[month - 1] ?? '';
}

/**
 * Status badge labels in Spanish.
 */
export const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
  NO_ASISTIO: 'No asistió',
};

/**
 * Status badge color variants.
 */
export const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  COMPLETADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
  NO_ASISTIO: 'bg-orange-100 text-orange-700 border-orange-200',
};
