/**
 * @fileoverview Shared chat assistant payload limits (must match API routes).
 * @module lib/chat-limits
 */

export const MAX_MESSAGE_CHARS = 2000;
export const MAX_HISTORY_MESSAGES = 30;
export const MAX_HISTORY_CHARS = 16_000;

export interface ChatHistoryMessage {
  text: string;
}

/**
 * Keeps the most recent messages that fit within server history caps.
 * Drops oldest entries first when count or total character length is exceeded.
 */
export function trimConversationHistory<T extends ChatHistoryMessage>(
  history: T[]
): T[] {
  let trimmed =
    history.length > MAX_HISTORY_MESSAGES
      ? history.slice(-MAX_HISTORY_MESSAGES)
      : [...history];

  const charCount = (items: T[]) =>
    items.reduce((sum, msg) => sum + String(msg?.text ?? "").length, 0);

  while (trimmed.length > 0 && charCount(trimmed) > MAX_HISTORY_CHARS) {
    trimmed = trimmed.slice(1);
  }

  return trimmed;
}
