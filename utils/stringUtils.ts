/**
 * @fileoverview String manipulation and formatting utilities.
 * @module utils/stringUtils
 * @description Provides utility functions for string capitalization and date formatting.
 * Includes functions for capitalizing strings and formatting dates in a human-readable format.
 */

/**
 * @brief Capitalizes the first character of a string.
 * @description Converts the first character of a string to uppercase and leaves the rest unchanged.
 * @param {string} str - The string to capitalize.
 * @returns {string} The string with the first character capitalized.
 * @example
 * ```typescript
 * capitalize("hello"); // Returns "Hello"
 * capitalize("WORLD"); // Returns "WORLD"
 * ```
 */
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * @brief Formats a date into a human-readable string.
 * @description Converts a Date object or date string into a formatted string with full month name,
 * day, and year. Returns "N/A" if the date is undefined or invalid.
 * @param {Date | string | undefined} date - The date to format (Date object, ISO string, or undefined).
 * @returns {string} Formatted date string (e.g., "January 15, 2024") or "N/A" if date is invalid.
 * @note Uses US locale formatting (en-US).
 * @note Returns "N/A" for undefined, null, or invalid dates.
 * @example
 * ```typescript
 * formatDate(new Date(2024, 0, 15)); // Returns "January 15, 2024"
 * formatDate("2024-01-15"); // Returns "January 15, 2024"
 * formatDate(undefined); // Returns "N/A"
 * ```
 */
export const formatDate = (date: Date | string | undefined) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};
