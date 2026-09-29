/**
 * Safe Date Formatting Utilities for DOGFOOD Platform
 * Ensures no "Invalid Date" strings are ever displayed in UI.
 * Standardizes display using UTC timestamps and user-friendly date notation.
 */

export function parseSafeDate(input: any): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === "number") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "—" || trimmed === "-") {
    return null;
  }

  // If it's already a descriptive range like "Oct 1 - Nov 20, 2026", do not parse as single date
  if (trimmed.includes(" - ") || trimmed.includes(" – ")) {
    return null;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function isDateValid(input: any): boolean {
  return parseSafeDate(input) !== null;
}

/**
 * Formats a date safely into a clean UTC string.
 * Example output: "Oct 1, 2026 UTC" or "Oct 1, 2026"
 */
export function formatDateSafe(
  input: any,
  fallback = "Ongoing",
  includeUtcTag = true
): string {
  if (!input) return fallback;

  // If input is already a human-friendly range or text like "Oct 1 - Nov 20, 2026"
  if (typeof input === "string" && (input.includes(" - ") || input.includes(" – ") || input.startsWith("Closing") || input.startsWith("Starts"))) {
    return input;
  }

  const d = parseSafeDate(input);
  if (!d) {
    if (typeof input === "string" && input.trim().length > 0 && input !== "null" && input !== "undefined") {
      return input;
    }
    return fallback;
  }

  const dateStr = d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return includeUtcTag ? `${dateStr} UTC` : dateStr;
}

/**
 * Formats date and time safely in UTC.
 * Example output: "Oct 1, 2026, 18:00 UTC"
 */
export function formatDateTimeSafe(
  input: any,
  fallback = "TBD"
): string {
  if (!input) return fallback;

  if (typeof input === "string" && (input.includes(" - ") || input.includes(" – "))) {
    return input;
  }

  const d = parseSafeDate(input);
  if (!d) {
    if (typeof input === "string" && input.trim().length > 0 && input !== "null" && input !== "undefined") {
      return input;
    }
    return fallback;
  }

  const formatted = d.toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${formatted} UTC`;
}

/**
 * Formats a short month/day date safely in UTC.
 * Example output: "Oct 1"
 */
export function formatShortDateSafe(
  input: any,
  fallback = "Ongoing"
): string {
  const d = parseSafeDate(input);
  if (!d) {
    if (typeof input === "string" && input.trim().length > 0 && input !== "null") {
      return input;
    }
    return fallback;
  }

  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}
