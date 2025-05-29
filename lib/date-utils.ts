// Utility functions to prevent hydration mismatches with dates

/**
 * Creates a date boundary that's consistent between server and client
 * This prevents hydration mismatches by avoiding Date.now() during render
 */
export function createDateBoundary(type: 'max' | 'min', dateString?: string): Date {
  const date = dateString ? new Date(dateString) : new Date();
  
  if (type === 'max') {
    // Set to end of day for maximum date
    date.setHours(23, 59, 59, 999);
  } else {
    // Set to start of day for minimum date
    date.setHours(0, 0, 0, 0);
  }
  
  return date;
}

/**
 * Creates today's date with end of day time for calendar disabled prop
 * This ensures consistent behavior between server and client rendering
 */
export function createTodayMaxBoundary(): Date {
  return createDateBoundary('max');
}

/**
 * Creates a minimum date boundary for calendar disabled prop
 */
export function createMinDateBoundary(year = 1900): Date {
  return createDateBoundary('min', `${year}-01-01`);
}

/**
 * Hydration-safe current timestamp generator
 * Returns 0 on server, actual timestamp on client
 */
export function getSafeTimestamp(): number {
  if (typeof window === 'undefined') {
    // Server-side: return a consistent value
    return 0;
  }
  // Client-side: return actual timestamp
  return Date.now();
}

/**
 * Get current date in a hydration-safe way
 * Uses a fixed date on server, current date on client
 */
export function getSafeCurrentDate(): Date {
  if (typeof window === 'undefined') {
    // Server-side: return a consistent date
    return new Date('2024-01-01T00:00:00.000Z');
  }
  // Client-side: return current date
  return new Date();
}

/**
 * Generate a unique ID in a hydration-safe way
 * Uses incremental counter on server, timestamp on client
 */
let serverIdCounter = 1;
export function getSafeUniqueId(prefix: string = 'id'): string {
  if (typeof window === 'undefined') {
    // Server-side: use incremental counter
    return `${prefix}-server-${serverIdCounter++}`;
  }
  // Client-side: use timestamp
  return `${prefix}-${Date.now()}`;
}

/**
 * Calendar disabled date checker that prevents hydration mismatches
 */
export function isDateDisabled(date: Date, options: {
  maxDate?: Date;
  minDate?: Date;
  disableFuture?: boolean;
  disablePast?: boolean;
} = {}): boolean {
  const {
    maxDate,
    minDate,
    disableFuture = true,
    disablePast = false
  } = options;

  const today = createTodayMaxBoundary();
  const minBoundary = minDate || createMinDateBoundary();

  if (disableFuture && date > (maxDate || today)) {
    return true;
  }

  if (disablePast && date < minBoundary) {
    return true;
  }

  if (maxDate && date > maxDate) {
    return true;
  }

  if (minDate && date < minDate) {
    return true;
  }

  return false;
}
