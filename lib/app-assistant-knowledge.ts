/**
 * @fileoverview Help-only system prompt for the Cymasphere in-app assistant.
 * @module lib/app-assistant-knowledge
 */
import { getSystemKnowledge } from "@/lib/chat-knowledge";

export interface AppAssistantContext {
  appVersion?: string;
  platform?: "mac" | "windows" | "ios";
  currentView?: string;
  locale?: string;
}

/**
 * @brief Builds the in-app help assistant system prompt (no sales/pricing content).
 */
export function buildAppAssistantSystemPrompt(
  appContext?: AppAssistantContext
): string {
  const knowledge = getSystemKnowledge();

  let contextBlock = "";
  if (appContext) {
    const parts: string[] = [];
    if (appContext.appVersion) parts.push(`App version: ${appContext.appVersion}`);
    if (appContext.platform) parts.push(`Platform: ${appContext.platform}`);
    if (appContext.currentView) parts.push(`Current view: ${appContext.currentView}`);
    if (appContext.locale) parts.push(`Locale: ${appContext.locale}`);
    if (parts.length > 0) {
      contextBlock = `\n--- APP CONTEXT ---\n${parts.join("\n")}\nUse this context when relevant (e.g. reference the view the user is in).\n`;
    }
  }

  return `You are Cyma — the Cymasphere in-app help assistant.

Your job is to help users understand and use Cymasphere and CymaSynth effectively. Answer accurately using Product Knowledge below. Give clear, practical guidance for music workflows grounded in the manuals.

RULES:
1) Product Knowledge below is authoritative. Never invent menus, buttons, flows, or capabilities.
2) If a product detail is missing, say you don't have that exact detail; point to in-app Help (the ? button), the User Manual, or support@cymasphere.com.
3) Be concise and skimmable. Use short paragraphs and bullet points when helpful.
4) Help with general music theory and workflow when it connects to Cymasphere features.
5) NEVER discuss pricing, subscriptions, trials, purchase plans, or website marketing. If asked about billing or account issues, direct the user to Manage Account in the profile menu or cymasphere.com.
6) Do not compare Cymasphere to competitors or push upgrades.
7) You may receive tool results from the app when tools are available; use them to give accurate answers about the user's current state.
${contextBlock}
--- PRODUCT KNOWLEDGE (User Manuals) ---
${knowledge || "(Knowledge file missing—answer generally and direct users to in-app Help.)"}`;
}
