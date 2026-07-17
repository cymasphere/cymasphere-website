/**
 * @fileoverview OpenAI tool definitions for the in-app assistant.
 * @module lib/app-assistant-tools
 *
 * Keep names/args in sync with Source/Assistant/AssistantTools.cpp handlers.
 */
import type OpenAI from "openai";

function tool(
  name: string,
  description: string,
  properties: Record<string, unknown> = {},
  required: string[] = []
): OpenAI.Chat.ChatCompletionTool {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: {
        type: "object",
        properties,
        required,
        additionalProperties: false,
      },
    },
  };
}

export const APP_ASSISTANT_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  // --- Read-only ---
  tool(
    "get_app_info",
    "Get app version, platform, current view, and locale."
  ),
  tool(
    "get_current_view",
    "Get the currently active main view (Song, Track, Palette, Voicing, or Mixer)."
  ),
  tool(
    "get_selected_track",
    "Get the currently selected track id, name, and type."
  ),
  tool(
    "get_musical_context",
    "Get live musical context: active key, palette/bank names and rotations, and active voicing button scale."
  ),
  tool(
    "get_modal_top",
    "Get the topmost modal/dialog currently open in the app, if any."
  ),

  // --- Navigation / help ---
  tool(
    "switch_view",
    "Switch the main app view.",
    {
      view: {
        type: "string",
        description: "One of: Song, Track, Palette, Voicing, Mixer",
        enum: ["Song", "Track", "Palette", "Voicing", "Mixer"],
      },
    },
    ["view"]
  ),
  tool("open_user_manual", "Open the Cymasphere User Manual."),
  tool(
    "set_help_mode",
    "Enable or disable in-app help mode (? hover help).",
    {
      enabled: {
        type: "boolean",
        description: "True to enable help mode, false to disable.",
      },
    },
    ["enabled"]
  ),
  tool(
    "show_help_topic",
    "Show an informational help popup with a title and body.",
    {
      title: { type: "string", description: "Popup title" },
      body: { type: "string", description: "Help text body" },
    },
    ["title", "body"]
  ),
  tool(
    "open_window",
    "Open a safe secondary window. Never opens Ask Cyma.",
    {
      window: {
        type: "string",
        description:
          "One of: spawn_bank, generate_progression, global_settings, hotkeys, audio_midi_settings",
        enum: [
          "spawn_bank",
          "generate_progression",
          "global_settings",
          "hotkeys",
          "audio_midi_settings",
        ],
      },
    },
    ["window"]
  ),

  // --- Musical actions ---
  tool(
    "create_bank",
    "Create a bank in the active palette from a default bank template name (e.g. MODES OF MAJOR, COMPOSITE MINOR). The app requires the user to Confirm in chat before this runs.",
    {
      templateName: {
        type: "string",
        description:
          "Exact default bank template name such as MODES OF MAJOR, HARMONIC MINOR, SECONDARY DOMINANT.",
      },
      index: {
        type: "integer",
        description: "Optional insert index; omit or -1 to append.",
      },
    },
    ["templateName"]
  ),
  tool(
    "spawn_bank_ui",
    "Open the Spawn Bank picker UI so the user can choose a template."
  ),
  tool(
    "set_key",
    "Set the active song/palette key (e.g. C, F#, Bb). Only when the user clearly asked to change it. The app requires Confirm in chat before this runs.",
    {
      key: { type: "string", description: "Key letter name, e.g. C, F#, Bb" },
    },
    ["key"]
  ),
  tool(
    "set_scale",
    "Set the scale on the active voicing button (cymatic). Only when the user clearly asked. The app requires Confirm in chat before this runs.",
    {
      scale: {
        type: "string",
        description: "Scale display name, e.g. Ionian, Dorian, Melodic Minor",
      },
    },
    ["scale"]
  ),
  tool(
    "rotate_palette",
    "Rotate the active palette. Prefer delta unless an absolute slot is requested. The app requires Confirm in chat before this runs.",
    {
      delta: {
        type: "integer",
        description: "Semitone steps to add (default 1). Ignored if absolute is set.",
      },
      absolute: {
        type: "integer",
        description: "Absolute rotation 0-11. Optional.",
      },
    }
  ),
  tool(
    "rotate_bank",
    "Rotate the active bank. Prefer delta unless an absolute slot is requested. The app requires Confirm in chat before this runs.",
    {
      delta: {
        type: "integer",
        description: "Semitone steps to add (default 1). Ignored if absolute is set.",
      },
      absolute: {
        type: "integer",
        description: "Absolute rotation 0-11. Optional.",
      },
    }
  ),
  tool(
    "play_cymatic",
    "Play a voicing button in the active bank by degree index 0-11. The app requires Confirm in chat before this runs.",
    {
      index: {
        type: "integer",
        description: "Degree slot index 0-11 (I through VII including chromatics).",
      },
    },
    ["index"]
  ),
  tool(
    "open_generate_progression",
    "Open the Generate Progression window (does not run generation headlessly)."
  ),
];

/**
 * @brief Returns tool schemas for the OpenAI completion call.
 */
export function getAppAssistantTools(): OpenAI.Chat.ChatCompletionTool[] {
  return APP_ASSISTANT_TOOLS;
}
