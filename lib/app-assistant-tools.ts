/**
 * @fileoverview OpenAI tool definitions for the in-app assistant.
 * @module lib/app-assistant-tools
 *
 * Planned tools (register schemas here when implemented):
 * - navigateView: switch to Song, Track, Palette, Voicing, or Mixer view
 * - openWindow: open Generate Progression, Global Settings, etc.
 * - highlightControl: point the user to a specific UI control
 * - setTempo: adjust project tempo
 */
import type OpenAI from "openai";

export const APP_ASSISTANT_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [];

/**
 * @brief Returns tool schemas for the OpenAI completion call.
 */
export function getAppAssistantTools(): OpenAI.Chat.ChatCompletionTool[] {
  return APP_ASSISTANT_TOOLS;
}
