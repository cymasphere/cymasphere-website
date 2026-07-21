/**
 * @fileoverview Typed access to the generated Ask Cyma tool catalog.
 * @module lib/app-assistant-tools
 */

import type OpenAI from "openai";
import {
  APP_ASSISTANT_TOOLS,
  CHAT_ASSISTANT_TOOL_NAMES,
} from "./generated/app-assistant-tools";

export {
  APP_ASSISTANT_TOOL_METADATA,
  APP_ASSISTANT_TOOLS,
} from "./generated/app-assistant-tools";

const CHAT_TOOL_NAMES: ReadonlySet<string> = new Set(
  CHAT_ASSISTANT_TOOL_NAMES
);

/**
 * @brief Returns canonical tool schemas for the OpenAI completion call.
 * @param mode chat = read-only inspect/recommend; agent = full catalog.
 */
export function getAppAssistantTools(
  mode: "chat" | "agent" = "chat"
): OpenAI.Chat.ChatCompletionTool[] {
  if (mode === "agent") {
    return APP_ASSISTANT_TOOLS;
  }

  return APP_ASSISTANT_TOOLS.filter(
    (tool) =>
      tool.type === "function" && CHAT_TOOL_NAMES.has(tool.function.name)
  );
}
