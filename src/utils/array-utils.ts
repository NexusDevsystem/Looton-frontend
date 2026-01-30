// Array utility functions to prevent .length crashes on undefined/null

/**
 * Safe length getter - returns 0 for non-arrays
 */
export const len = (v: any): number => (Array.isArray(v) ? v.length : 0);

/**
 * Safe array getter - returns empty array for non-arrays
 */
export const arr = <T>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

/**
 * Check if value is a non-empty array
 */
export const hasItems = (v: any): boolean => Array.isArray(v) && v.length > 0;
