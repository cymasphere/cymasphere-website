/**
 * @fileoverview Generated OpenAI definitions for Ask Cyma tools.
 *
 * Do not edit by hand.
 * Source: cymasphere/Source/Assistant/AssistantToolContract.json
 * Generator: cymasphere/Scripts/Assistant/generate-assistant-tool-contract.mjs
 */

import type OpenAI from "openai";

export const APP_ASSISTANT_TOOL_METADATA = [
  {
    "name": "get_app_info",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use the returned app and platform fields as current runtime state."
    }
  },
  {
    "name": "get_current_view",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use the returned view as the active main view."
    }
  },
  {
    "name": "get_selected_track",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use the returned id, name, and type to identify the selected track."
    }
  },
  {
    "name": "get_musical_context",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Treat returned musical context as a point-in-time snapshot."
    }
  },
  {
    "name": "get_modal_top",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Check open and label before suggesting modal-specific actions."
    }
  },
  {
    "name": "ask_user_question",
    "handler": "client",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "none",
    "result": {
      "envelope": "client",
      "verificationHint": "Use the client callback result as the user's explicit answer."
    }
  },
  {
    "name": "create_plan",
    "handler": "client",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "none",
    "result": {
      "envelope": "client",
      "verificationHint": "A successful result means the plan is visible, not that deferred mutations ran."
    }
  },
  {
    "name": "update_plan_todos",
    "handler": "client",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "none",
    "result": {
      "envelope": "client",
      "verificationHint": "Verify the returned todo list reflects the requested merge or replacement."
    }
  },
  {
    "name": "switch_view",
    "handler": "navigation",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "none",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned view matches the requested view."
    }
  },
  {
    "name": "open_user_manual",
    "handler": "navigation",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "none",
    "result": {
      "envelope": "native",
      "verificationHint": "A successful result means the manual window was requested."
    }
  },
  {
    "name": "set_help_mode",
    "handler": "navigation",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "none",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the result summary reports the requested help-mode state."
    }
  },
  {
    "name": "show_help_topic",
    "handler": "navigation",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "none",
    "result": {
      "envelope": "native",
      "verificationHint": "A successful result means the help popup was requested."
    }
  },
  {
    "name": "open_window",
    "handler": "navigation",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "none",
    "result": {
      "envelope": "native",
      "verificationHint": "Check ok because some windows are unavailable in plugin or iOS builds."
    }
  },
  {
    "name": "spawn_bank_ui",
    "handler": "navigation",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "none",
    "result": {
      "envelope": "native",
      "verificationHint": "A successful result means the picker was opened for manual choice."
    }
  },
  {
    "name": "open_generate_progression",
    "handler": "navigation",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "none",
    "result": {
      "envelope": "native",
      "verificationHint": "Check ok because an active palette is required."
    }
  },
  {
    "name": "list_songs",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use returned ids for subsequent song operations."
    }
  },
  {
    "name": "list_palettes",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use returned ids for subsequent palette operations."
    }
  },
  {
    "name": "list_banks",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use returned ids for subsequent bank operations."
    }
  },
  {
    "name": "list_bank_templates",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Pass an exact returned template name to create_bank."
    }
  },
  {
    "name": "list_tracks",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use returned track identity and type for later track or preset tools."
    }
  },
  {
    "name": "list_progressions",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use exact returned names or indexes in later progression operations."
    }
  },
  {
    "name": "list_progression_presets",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use these presets as read-only reference for the manual Generate Progression window; generate_progression does not accept a preset."
    }
  },
  {
    "name": "list_sequencer_templates",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use an exact returned name with apply_sequencer_template."
    }
  },
  {
    "name": "list_groove_templates",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use an exact returned name with apply_groove_template."
    }
  },
  {
    "name": "list_instruments",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Pass an exact returned id to set_track_instrument."
    }
  },
  {
    "name": "list_track_fx",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use returned plugin ids or indexes when removing track effects."
    }
  },
  {
    "name": "list_cymasynth_preset_categories",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Use an exact returned category to filter list_cymasynth_presets."
    }
  },
  {
    "name": "list_cymasynth_presets",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Present returned howToLoad steps as manual guidance; do not claim the preset was applied."
    }
  },
  {
    "name": "get_cymasynth_preset_info",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Present howToLoad as manual guidance and never report the preset as applied."
    }
  },
  {
    "name": "recommend_cymasynth_preset",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Offer the returned options and manual load steps; the user applies any preset."
    }
  },
  {
    "name": "get_cymasynth_patch_summary",
    "handler": "native",
    "modes": [
      "chat",
      "agent"
    ],
    "behavior": "read",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Treat the result as a compact read-only snapshot, not full patch JSON."
    }
  },
  {
    "name": "set_active_palette",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned palette identity before dependent operations."
    }
  },
  {
    "name": "set_active_bank",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned bank identity before dependent operations."
    }
  },
  {
    "name": "set_active_cymatic",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned index or voicing identity before dependent operations."
    }
  },
  {
    "name": "set_active_track",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned track identity before dependent operations."
    }
  },
  {
    "name": "set_active_progression",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "run_immediately",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned progression identity before dependent operations."
    }
  },
  {
    "name": "create_song",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and retain the returned song id and name."
    }
  },
  {
    "name": "switch_song",
    "handler": "navigation",
    "modes": [
      "agent"
    ],
    "behavior": "navigation",
    "confirmation": "none",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned song id and name."
    }
  },
  {
    "name": "duplicate_song",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok, sourceId, and the returned duplicate id and name."
    }
  },
  {
    "name": "delete_song",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "destructive",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok; failure may indicate last-song protection."
    }
  },
  {
    "name": "rename_song",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned id identifies the intended source and name equals newName."
    }
  },
  {
    "name": "create_palette",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and retain the returned palette identity."
    }
  },
  {
    "name": "duplicate_palette",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok, sourceId, and the returned duplicate id and name."
    }
  },
  {
    "name": "delete_palette",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "destructive",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok; failure may indicate last-palette protection."
    }
  },
  {
    "name": "rename_palette",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned id identifies the intended source and name equals newName."
    }
  },
  {
    "name": "create_bank",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and retain the returned bank name and template name."
    }
  },
  {
    "name": "duplicate_bank",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok, sourceId, and the returned duplicate id and name."
    }
  },
  {
    "name": "delete_bank",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "destructive",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok before assuming the bank was removed."
    }
  },
  {
    "name": "rename_bank",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned id identifies the intended source and name equals newName."
    }
  },
  {
    "name": "save_bank_as_template",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and the returned template identity."
    }
  },
  {
    "name": "set_key",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned key matches the requested spelling."
    }
  },
  {
    "name": "set_scale",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned scale matches the requested scale."
    }
  },
  {
    "name": "set_cymatic_scale",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned scale and voicing index."
    }
  },
  {
    "name": "clear_cymatic",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "destructive",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and the affected voicing index."
    }
  },
  {
    "name": "rotate_palette",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned normalized rotation."
    }
  },
  {
    "name": "rotate_bank",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned normalized rotation."
    }
  },
  {
    "name": "play_cymatic",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and the returned index and scale."
    }
  },
  {
    "name": "delete_progression",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "destructive",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok before assuming the progression was removed."
    }
  },
  {
    "name": "rename_progression",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned index identifies the intended source and name equals newName."
    }
  },
  {
    "name": "generate_progression",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok, the returned progression identity, and generated block count."
    }
  },
  {
    "name": "create_track",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and retain the returned track id, name, and type."
    }
  },
  {
    "name": "delete_track",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "destructive",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok before assuming the track was removed."
    }
  },
  {
    "name": "rename_track",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned track id/index identifies the intended source and name equals newName."
    }
  },
  {
    "name": "apply_sequencer_template",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and the returned track and template identities."
    }
  },
  {
    "name": "apply_groove_template",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and the returned track and template identities."
    }
  },
  {
    "name": "save_sequencer_as_template",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and the returned template name."
    }
  },
  {
    "name": "save_groove_as_template",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and the returned template name."
    }
  },
  {
    "name": "set_sequencer_params",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned track identity and all resulting sequencer values, including reset."
    }
  },
  {
    "name": "set_track_mixer",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify the returned track identity and resulting mute, solo, fader, and pan values."
    }
  },
  {
    "name": "set_track_send",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify source track identity, sendIndex, level, enabled, and resolved targetTrackId."
    }
  },
  {
    "name": "set_track_instrument",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok and the returned plugin identifier."
    }
  },
  {
    "name": "add_track_fx",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok, then use list_track_fx if slot confirmation is needed."
    }
  },
  {
    "name": "remove_track_fx",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "destructive",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify track identity, slotIndex, and removedPluginId."
    }
  },
  {
    "name": "add_track_midi_fx",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "mutation",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify ok, then use list_track_fx if slot confirmation is needed."
    }
  },
  {
    "name": "remove_track_midi_fx",
    "handler": "native",
    "modes": [
      "agent"
    ],
    "behavior": "destructive",
    "confirmation": "required",
    "result": {
      "envelope": "native",
      "verificationHint": "Verify track identity, slotIndex, and removedPluginId."
    }
  }
] as const;

export const CHAT_ASSISTANT_TOOL_NAMES = [
  "get_app_info",
  "get_current_view",
  "get_selected_track",
  "get_musical_context",
  "get_modal_top",
  "list_songs",
  "list_palettes",
  "list_banks",
  "list_bank_templates",
  "list_tracks",
  "list_progressions",
  "list_progression_presets",
  "list_sequencer_templates",
  "list_groove_templates",
  "list_instruments",
  "list_track_fx",
  "list_cymasynth_preset_categories",
  "list_cymasynth_presets",
  "get_cymasynth_preset_info",
  "recommend_cymasynth_preset",
  "get_cymasynth_patch_summary"
] as const;

export const APP_ASSISTANT_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    "type": "function",
    "function": {
      "name": "get_app_info",
      "description": "Get app version, platform, current view, and locale. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_current_view",
      "description": "Get the currently active main view (Song, Track, Palette, Voicing, or Mixer). Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_selected_track",
      "description": "Get the currently selected track id, name, and type. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_musical_context",
      "description": "Get live musical context: active key, palette and bank names and rotations, and active voicing button scale. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_modal_top",
      "description": "Get the topmost modal or dialog currently open in the app, if any. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "ask_user_question",
      "description": "Ask clarifying questions about subjective taste or creative direction only (mood, genre feel, arrangement goals). Never use this for factual project data; use get_* or list_* first. Shows blocking UI with options and free text.",
      "parameters": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Optional card title."
          },
          "questions": {
            "type": "array",
            "description": "One or more questions.",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "prompt": {
                  "type": "string"
                },
                "options": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string"
                      },
                      "label": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "id",
                      "label"
                    ],
                    "additionalProperties": false
                  }
                },
                "allowMultiple": {
                  "type": "boolean",
                  "description": "False for single choice; true for multi-select."
                }
              },
              "required": [
                "id",
                "prompt",
                "options"
              ],
              "additionalProperties": false
            }
          }
        },
        "additionalProperties": false,
        "required": [
          "questions"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "create_plan",
      "description": "Present a reviewable plan with todos. The user must choose Build before deferred mutators run. Put mutators in todos as tool plus arguments and do not claim changes were applied until Build.",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Short plan name."
          },
          "overview": {
            "type": "string",
            "description": "One-paragraph overview."
          },
          "plan": {
            "type": "string",
            "description": "Markdown plan body."
          },
          "todos": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "content": {
                  "type": "string",
                  "description": "Human-readable step."
                },
                "status": {
                  "type": "string",
                  "enum": [
                    "pending",
                    "in_progress",
                    "completed",
                    "cancelled"
                  ]
                },
                "tool": {
                  "type": "string",
                  "description": "Mutator tool name to run on Build."
                },
                "arguments": {
                  "type": "object",
                  "description": "Arguments for the deferred tool."
                }
              },
              "required": [
                "id",
                "content"
              ],
              "additionalProperties": false
            }
          }
        },
        "additionalProperties": false,
        "required": [
          "plan",
          "todos"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "update_plan_todos",
      "description": "Merge todo status or content into the visible plan draft before or during Build progress.",
      "parameters": {
        "type": "object",
        "properties": {
          "merge": {
            "type": "boolean",
            "description": "True to merge by id; false to replace."
          },
          "todos": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "content": {
                  "type": "string"
                },
                "status": {
                  "type": "string",
                  "enum": [
                    "pending",
                    "in_progress",
                    "completed",
                    "cancelled"
                  ]
                },
                "tool": {
                  "type": "string"
                },
                "arguments": {
                  "type": "object"
                }
              },
              "required": [
                "id"
              ],
              "additionalProperties": false
            }
          }
        },
        "additionalProperties": false,
        "required": [
          "todos"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "switch_view",
      "description": "Switch the main app view.",
      "parameters": {
        "type": "object",
        "properties": {
          "view": {
            "type": "string",
            "enum": [
              "Song",
              "Track",
              "Palette",
              "Voicing",
              "Mixer"
            ]
          }
        },
        "additionalProperties": false,
        "required": [
          "view"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "open_user_manual",
      "description": "Open the Cymasphere User Manual.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_help_mode",
      "description": "Enable or disable in-app help mode.",
      "parameters": {
        "type": "object",
        "properties": {
          "enabled": {
            "type": "boolean"
          }
        },
        "additionalProperties": false,
        "required": [
          "enabled"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "show_help_topic",
      "description": "Show an informational help popup with a title and body.",
      "parameters": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "body": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "title",
          "body"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "open_window",
      "description": "Open a safe secondary window. Never opens Ask Cyma.",
      "parameters": {
        "type": "object",
        "properties": {
          "window": {
            "type": "string",
            "enum": [
              "spawn_bank",
              "generate_progression",
              "global_settings",
              "hotkeys",
              "audio_midi_settings"
            ]
          }
        },
        "additionalProperties": false,
        "required": [
          "window"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "spawn_bank_ui",
      "description": "Open the Spawn Bank picker UI so the user can choose a template.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "open_generate_progression",
      "description": "Open the Generate Progression window for manual adjustment. Prefer generate_progression in a plan when applying for the user.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_songs",
      "description": "List all songs with id, name, and which is active. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_palettes",
      "description": "List palettes on the active song. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_banks",
      "description": "List banks on the active palette. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_bank_templates",
      "description": "List default and custom bank templates with name, type, and isDefault. Query before proposing create_bank.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_tracks",
      "description": "List tracks on the active song with id, name, type, index, and active state. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_progressions",
      "description": "List progressions on the active palette. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_progression_presets",
      "description": "List progression generation presets. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_sequencer_templates",
      "description": "List sequencer templates. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_groove_templates",
      "description": "List groove templates. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_instruments",
      "description": "List available instrument plugins with id and name. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_track_fx",
      "description": "List FX and MIDI-FX slot identifiers on a track. Call this tool instead of asking the user for this information.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_cymasynth_preset_categories",
      "description": "List CymaSynth factory preset categories. CymaSynth changes remain manual; Ask Cyma only reads and recommends.",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_cymasynth_presets",
      "description": "List CymaSynth factory presets with an optional category filter. Set includeSummary for sonic details and manual loading steps.",
      "parameters": {
        "type": "object",
        "properties": {
          "category": {
            "type": "string",
            "description": "For example pad, bass, or pluck."
          },
          "includeSummary": {
            "type": "boolean",
            "description": "Include summary and howToLoad for each preset."
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_cymasynth_preset_info",
      "description": "Get detailed information for one CymaSynth factory preset: category guide, sonic summary, and manual loading steps. Ask Cyma cannot apply presets.",
      "parameters": {
        "type": "object",
        "properties": {
          "presetId": {
            "type": "string",
            "description": "Preset stem such as pad-012."
          },
          "preset": {
            "type": "string",
            "description": "Preset id or display name."
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "recommend_cymasynth_preset",
      "description": "Recommend one to three CymaSynth factory presets for a track type and optional style. Returns summary, reason, and manual loading steps. Resolve trackType from list_tracks and never ask for factual track data.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackType": {
            "type": "string",
            "enum": [
              "Pattern",
              "Voicing",
              "Sequencer",
              "Groove",
              "Aux"
            ]
          },
          "style": {
            "type": "string",
            "description": "Optional style hint, such as modal jazz or ambient."
          }
        },
        "additionalProperties": false,
        "required": [
          "trackType"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_cymasynth_patch_summary",
      "description": "Read a compact summary of the current CymaSynth patch on a track, including oscillators, filters, envelopes, effects, and modulation counts. Ask Cyma cannot edit the patch.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_active_palette",
      "description": "Activate a palette by id or name.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_active_bank",
      "description": "Activate a bank by id or name.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_active_cymatic",
      "description": "Select a voicing button by degree index 0 through 11.",
      "parameters": {
        "type": "object",
        "properties": {
          "index": {
            "type": "integer"
          }
        },
        "additionalProperties": false,
        "required": [
          "index"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_active_track",
      "description": "Select a track by id, name, or index.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_active_progression",
      "description": "Activate a progression by name or index.",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "index": {
            "type": "integer"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "create_song",
      "description": "Create a new song and its default palette, then switch to Song view. Prefer this in create_plan todos for workspace setup.",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "switch_song",
      "description": "Switch the active song by id or name.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "duplicate_song",
      "description": "Duplicate the song identified by id or name, or the active song when no source is supplied. newName is only the optional duplicate name.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "newName": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "delete_song",
      "description": "Delete a song. The last song is protected.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "rename_song",
      "description": "Rename the song identified by id or name, or the active song when no source is supplied. newName is only the destination name.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "newName": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "newName"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "create_palette",
      "description": "Create a palette on the active song.",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "duplicate_palette",
      "description": "Duplicate the active-song palette identified by id or name, or the active palette when no source is supplied. newName is only the optional duplicate name.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "newName": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "delete_palette",
      "description": "Delete a palette. The last palette is protected.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "rename_palette",
      "description": "Rename the active-song palette identified by id or name, or the active palette when no source is supplied. newName is only the destination name.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "newName": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "newName"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "create_bank",
      "description": "Create a bank from a template on the active palette. Query list_bank_templates first.",
      "parameters": {
        "type": "object",
        "properties": {
          "templateName": {
            "type": "string"
          },
          "index": {
            "type": "integer"
          }
        },
        "additionalProperties": false,
        "required": [
          "templateName"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "duplicate_bank",
      "description": "Duplicate the active-palette bank identified by id or name, or the active bank when no source is supplied. newName is only the optional duplicate name.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "newName": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "delete_bank",
      "description": "Delete a bank.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "rename_bank",
      "description": "Rename the active-palette bank identified by id or name, or the active bank when no source is supplied. newName is only the destination name.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "newName": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "newName"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "save_bank_as_template",
      "description": "Save the active or named bank as a custom template.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_key",
      "description": "Set the Song or Palette key setting.",
      "parameters": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string",
            "description": "For example C, F#, or Bb."
          }
        },
        "additionalProperties": false,
        "required": [
          "key"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_scale",
      "description": "Set the scale on the active voicing button.",
      "parameters": {
        "type": "object",
        "properties": {
          "scale": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "scale"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_cymatic_scale",
      "description": "Set the scale on a voicing button by index, defaulting to the active button.",
      "parameters": {
        "type": "object",
        "properties": {
          "scale": {
            "type": "string"
          },
          "index": {
            "type": "integer"
          }
        },
        "additionalProperties": false,
        "required": [
          "scale"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "clear_cymatic",
      "description": "Clear a voicing button scale to blank.",
      "parameters": {
        "type": "object",
        "properties": {
          "index": {
            "type": "integer"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "rotate_palette",
      "description": "Rotate the active palette by delta or to an absolute pitch-class offset.",
      "parameters": {
        "type": "object",
        "properties": {
          "delta": {
            "type": "integer"
          },
          "absolute": {
            "type": "integer"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "rotate_bank",
      "description": "Rotate the active bank by delta or to an absolute pitch-class offset.",
      "parameters": {
        "type": "object",
        "properties": {
          "delta": {
            "type": "integer"
          },
          "absolute": {
            "type": "integer"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "play_cymatic",
      "description": "Play a voicing button by degree index 0 through 11.",
      "parameters": {
        "type": "object",
        "properties": {
          "index": {
            "type": "integer"
          }
        },
        "additionalProperties": false,
        "required": [
          "index"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "delete_progression",
      "description": "Delete a progression.",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "index": {
            "type": "integer"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "rename_progression",
      "description": "Rename the progression identified by name or 0-based index, or the active progression when no source is supplied. newName is only the destination name.",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "index": {
            "type": "integer",
            "minimum": 0
          },
          "newName": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "newName"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "generate_progression",
      "description": "Create or reuse a named progression on the active palette and fill it with chord blocks. Never leaves an empty progression.",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Required progression display name."
          },
          "blockCount": {
            "type": "integer",
            "description": "Number of blocks, default 8."
          },
          "bars": {
            "type": "integer",
            "description": "Alias for blockCount."
          }
        },
        "additionalProperties": false,
        "required": [
          "name"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "create_track",
      "description": "Create a track on the active song. Pattern, Voicing, and Sequencer tracks auto-assign CymaSynth when available.",
      "parameters": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "Pattern",
              "Voicing",
              "Sequencer",
              "Groove",
              "Aux"
            ]
          },
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "type"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "delete_track",
      "description": "Delete a track.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "rename_track",
      "description": "Rename the track identified by trackId, trackName, or 0-based trackIndex, or the active track when no source is supplied. newName is only the destination name.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "minimum": 0,
            "description": "0-based track index on the active song."
          },
          "newName": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "newName"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "apply_sequencer_template",
      "description": "Apply a sequencer template to a Sequencer track.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          },
          "templateName": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "templateName"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "apply_groove_template",
      "description": "Apply a groove template to a Groove track.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          },
          "templateName": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "templateName"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "save_sequencer_as_template",
      "description": "Save a track's sequencer as a template.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          },
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "name"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "save_groove_as_template",
      "description": "Save a track's groove as a template.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          },
          "name": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "name"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_sequencer_params",
      "description": "Set basic sequencer controls including swing, sustain, deviation, loop, reset, and includeBass.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          },
          "swing": {
            "type": "integer"
          },
          "sustain": {
            "type": "integer"
          },
          "deviation": {
            "type": "integer"
          },
          "loop": {
            "type": "boolean"
          },
          "reset": {
            "type": "boolean"
          },
          "includeBass": {
            "type": "boolean"
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_track_mixer",
      "description": "Set mute, solo, fader, and pan on a track.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "minimum": 0,
            "description": "0-based track index on the active song."
          },
          "mute": {
            "type": "boolean"
          },
          "solo": {
            "type": "boolean"
          },
          "fader": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Range 0 through 1."
          },
          "pan": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Range 0 through 1."
          }
        },
        "additionalProperties": false,
        "required": []
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_track_send",
      "description": "Set auxiliary send 1 or 2 level, enabled state, and target.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Source track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Source track display name."
          },
          "trackIndex": {
            "type": "integer",
            "minimum": 0,
            "description": "0-based source track index on the active song."
          },
          "sendIndex": {
            "type": "integer",
            "enum": [
              1,
              2
            ],
            "description": "Exactly 1 or 2."
          },
          "level": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Range 0 through 1."
          },
          "enabled": {
            "type": "boolean"
          },
          "targetTrackId": {
            "type": "string",
            "description": "Destination track id from list_tracks."
          },
          "targetTrackName": {
            "type": "string",
            "description": "Destination track display name."
          }
        },
        "additionalProperties": false,
        "required": [
          "sendIndex"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "set_track_instrument",
      "description": "Set a track's plugin identifier. Use cymasynth for the default CymaSynth id.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          },
          "pluginId": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "pluginId"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "add_track_fx",
      "description": "Append an audio FX plugin id to a track.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          },
          "pluginId": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "pluginId"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "remove_track_fx",
      "description": "Remove an audio FX plugin from a track by required 0-based slotIndex.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "minimum": 0,
            "description": "0-based track index on the active song."
          },
          "slotIndex": {
            "type": "integer",
            "minimum": 0,
            "description": "Required 0-based audio FX slot from list_track_fx."
          }
        },
        "additionalProperties": false,
        "required": [
          "slotIndex"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "add_track_midi_fx",
      "description": "Append a MIDI FX plugin id to a track.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "description": "0-based track index on the active song."
          },
          "pluginId": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "required": [
          "pluginId"
        ]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "remove_track_midi_fx",
      "description": "Remove a MIDI FX plugin from a track by required 0-based slotIndex.",
      "parameters": {
        "type": "object",
        "properties": {
          "trackId": {
            "type": "string",
            "description": "Track id from list_tracks."
          },
          "trackName": {
            "type": "string",
            "description": "Track display name."
          },
          "trackIndex": {
            "type": "integer",
            "minimum": 0,
            "description": "0-based track index on the active song."
          },
          "slotIndex": {
            "type": "integer",
            "minimum": 0,
            "description": "Required 0-based MIDI FX slot from list_track_fx."
          }
        },
        "additionalProperties": false,
        "required": [
          "slotIndex"
        ]
      }
    }
  }
];
