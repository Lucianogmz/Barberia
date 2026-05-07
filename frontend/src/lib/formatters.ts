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
 * Format a date for display in Spanish (Argentina timezone).
 * Example: "martes, 6 de mayo de 2026"
 */
export function formatDateES(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
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
  const d = typeof date === 'string' ? new Date(date) : date;
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
  PENDIENTE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  COMPLETADO: 'bg-green-500/20 text-green-400 border-green-500/30',
  CANCELADO: 'bg-red-500/20 text-red-400 border-red-500/30',
  NO_ASISTIO: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};
