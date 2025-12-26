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

/**
 * @brief Formats a user's name from first and last name components.
 * @description Combines first and last name into a display string, handling null/undefined values.
 * Returns "Guest" if both names are missing, or just the available name if only one is provided.
 * @param {string | null | undefined} firstName - The user's first name.
 * @param {string | null | undefined} lastName - The user's last name.
 * @returns {string} Formatted name string: "Guest" if both missing, single name if one missing, or full name if both present.
 * @note Handles null, undefined, and empty string values consistently.
 * @example
 * ```typescript
 * formatUserName("John", "Doe"); // Returns "John Doe"
 * formatUserName("John", null); // Returns "John"
 * formatUserName(null, "Doe"); // Returns "Doe"
 * formatUserName(null, null); // Returns "Guest"
 * formatUserName(undefined, undefined); // Returns "Guest"
 * ```
 */
export const formatUserName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string => {
  // If both names are null/undefined/empty, return "Guest"
  if (!firstName && !lastName) {
    return "Guest";
  }

  // If only one name exists, return just that name
  if (firstName && !lastName) {
    return firstName;
  }
  if (!firstName && lastName) {
    return lastName;
  }

  // Both names exist, return full name
  return `${firstName} ${lastName}`;
};