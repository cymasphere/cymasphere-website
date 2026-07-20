/**
 * @fileoverview OpenAI tool definitions for the in-app assistant.
 * @module lib/app-assistant-tools
 *
 * Keep names/args in sync with Source/Assistant/AssistantTools.cpp and
 * Source/Assistant/AssistantWorkspaceTools.cpp handlers.
 * ask_user_question / create_plan / update_plan_todos are handled by the
 * native client (not the tool registry).
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

const trackRef = {
  trackId: { type: "string", description: "Track id from list_tracks." },
  trackName: { type: "string", description: "Track display name." },
  trackIndex: { type: "integer", description: "0-based track index on the active song." },
};

/** Read-only tools: call these instead of asking the user for the same data in chat. */
const inspect = (description: string) =>
  `${description} Call this tool instead of asking the user for this information.`;

export const APP_ASSISTANT_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  // --- Read-only ---
  tool("get_app_info", inspect("Get app version, platform, current view, and locale.")),
  tool(
    "get_current_view",
    inspect("Get the currently active main view (Song, Track, Palette, Voicing, or Mixer).")
  ),
  tool("get_selected_track", inspect("Get the currently selected track id, name, and type.")),
  tool(
    "get_musical_context",
    inspect(
      "Get live musical context: active key, palette/bank names and rotations, and active voicing button scale."
    )
  ),
  tool("get_modal_top", inspect("Get the topmost modal/dialog currently open in the app, if any.")),

  // --- Plan mode (client-handled) ---
  tool(
    "ask_user_question",
    "Ask clarifying questions about subjective taste or creative direction only (mood, genre feel, arrangement goals). NEVER for factual project data — use get_* / list_* first (songs, palettes, banks, tracks, key, presets, instruments, FX, templates). Blocking UI with options + free text.",
    {
      title: { type: "string", description: "Optional card title." },
      questions: {
        type: "array",
        description: "One or more questions.",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            prompt: { type: "string" },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                },
                required: ["id", "label"],
              },
            },
            allowMultiple: {
              type: "boolean",
              description: "False = single choice; true = multi-select.",
            },
          },
          required: ["id", "prompt", "options"],
        },
      },
    },
    ["questions"]
  ),
  tool(
    "create_plan",
    "Present a reviewable plan with todos. User must Build before deferred mutators run. Put mutators in todos as tool+arguments; do not claim changes applied until Build. Hierarchy order: Song → Palette → Bank → Voicing → progression → tracks → instruments → sequencer/groove → mixer.",
    {
      name: { type: "string", description: "Short plan name." },
      overview: { type: "string", description: "One-paragraph overview." },
      plan: { type: "string", description: "Markdown plan body." },
      todos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            content: { type: "string", description: "Human-readable step." },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed", "cancelled"],
            },
            tool: {
              type: "string",
              description: "Mutator tool name to run on Build.",
            },
            arguments: {
              type: "object",
              description: "Arguments for the deferred tool.",
            },
          },
          required: ["id", "content"],
        },
      },
    },
    ["plan", "todos"]
  ),
  tool(
    "update_plan_todos",
    "Merge todo status/content into the visible plan draft (before or during Build progress).",
    {
      merge: { type: "boolean", description: "True to merge by id; false to replace." },
      todos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            content: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed", "cancelled"],
            },
            tool: { type: "string" },
            arguments: { type: "object" },
          },
          required: ["id"],
        },
      },
    },
    ["todos"]
  ),

  // --- Navigation / help ---
  tool(
    "switch_view",
    "Switch the main app view.",
    {
      view: {
        type: "string",
        enum: ["Song", "Track", "Palette", "Voicing", "Mixer"],
      },
    },
    ["view"]
  ),
  tool("open_user_manual", "Open the Cymasphere User Manual."),
  tool(
    "set_help_mode",
    "Enable or disable in-app help mode (? hover help).",
    { enabled: { type: "boolean" } },
    ["enabled"]
  ),
  tool(
    "show_help_topic",
    "Show an informational help popup with a title and body.",
    {
      title: { type: "string" },
      body: { type: "string" },
    },
    ["title", "body"]
  ),
  tool(
    "open_window",
    "Open a safe secondary window. Never opens Ask Cyma.",
    {
      window: {
        type: "string",
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
  tool("spawn_bank_ui", "Open the Spawn Bank picker UI so the user can choose a template."),
  tool(
    "open_generate_progression",
    "Open the Generate Progression window (manual tweak). Prefer generate_progression in a plan when applying for the user."
  ),

  // --- Lists ---
  tool("list_songs", inspect("List all songs with id, name, and which is active.")),
  tool("list_palettes", inspect("List palettes on the active song.")),
  tool("list_banks", inspect("List banks on the active palette.")),
  tool(
    "list_bank_templates",
    inspect(
      "List default and custom bank templates (name, type, isDefault). Query before proposing create_bank."
    )
  ),
  tool(
    "list_tracks",
    inspect("List tracks on the active song (id, name, type, index, active).")
  ),
  tool("list_progressions", inspect("List progressions on the active palette.")),
  tool("list_progression_presets", inspect("List progression generation presets.")),
  tool("list_sequencer_templates", inspect("List sequencer templates.")),
  tool("list_groove_templates", inspect("List groove templates.")),
  tool("list_instruments", inspect("List available instrument plugins (id + name).")),
  tool("list_track_fx", inspect("List FX and MIDI-FX slot identifiers on a track."), trackRef),
  tool(
    "list_cymasynth_preset_categories",
    inspect("List CymaSynth factory preset categories (bass, pad, keys, lead, strings, pluck, drums, …).")
  ),
  tool(
    "list_cymasynth_presets",
    inspect("List CymaSynth factory presets; optional category filter. Set includeSummary for sonic details and load steps."),
    {
      category: { type: "string", description: "e.g. pad, bass, pluck" },
      includeSummary: {
        type: "boolean",
        description: "When true, include summary and howToLoad for each preset.",
      },
    }
  ),
  tool(
    "get_cymasynth_preset_info",
    inspect(
      "Detailed info for one CymaSynth factory preset: category guide, sonic summary, and how the user loads it in CymaSynth. Ask Cyma cannot apply presets."
    ),
    {
      presetId: { type: "string", description: "Preset stem e.g. pad-012" },
      preset: { type: "string", description: "Preset id or display name" },
    }
  ),
  tool(
    "recommend_cymasynth_preset",
    "Recommend 1–3 CymaSynth factory presets for a track type and optional style. Returns summary, reason, and howToLoad steps (user picks the preset in CymaSynth). Resolve trackType from list_tracks — never ask the user.",
    {
      trackType: {
        type: "string",
        enum: ["Pattern", "Voicing", "Sequencer", "Groove", "Aux"],
      },
      style: { type: "string", description: "Optional style hint, e.g. modal jazz, ambient." },
    },
    ["trackType"]
  ),
  tool(
    "get_cymasynth_patch_summary",
    inspect(
      "Read a compact CymaSynth patch summary on a track (oscillators, filters, envelopes, FX on, mod route count). Prefer before changing sound settings. Not full JSON."
    ),
    trackRef
  ),

  // --- set_active ---
  tool("set_active_palette", "Activate a palette by id or name.", {
    id: { type: "string" },
    name: { type: "string" },
  }),
  tool("set_active_bank", "Activate a bank by id or name.", {
    id: { type: "string" },
    name: { type: "string" },
  }),
  tool(
    "set_active_cymatic",
    "Select voicing button (cymatic) by degree index 0–11.",
    { index: { type: "integer" } },
    ["index"]
  ),
  tool("set_active_track", "Select a track by id, name, or index.", trackRef),
  tool("set_active_progression", "Activate a progression by name or index.", {
    name: { type: "string" },
    index: { type: "integer" },
  }),

  // --- Song / palette / bank / voicing ---
  tool(
    "create_song",
    "Create a new song (also creates DEFAULT palette). First hierarchy step. Prefer in create_plan todos for workspace setup.",
    { name: { type: "string" } }
  ),
  tool("switch_song", "Switch the active song by id or name.", {
    id: { type: "string" },
    name: { type: "string" },
  }),
  tool("duplicate_song", "Duplicate a song.", {
    id: { type: "string" },
    name: { type: "string" },
    newName: { type: "string" },
  }),
  tool("delete_song", "Delete a song (guards last song).", {
    id: { type: "string" },
    name: { type: "string" },
  }),
  tool("rename_song", "Rename a song.", {
    id: { type: "string" },
    name: { type: "string" },
    newName: { type: "string" },
  }, ["newName"]),
  tool("create_palette", "Create a palette on the active song.", {
    name: { type: "string" },
  }),
  tool("duplicate_palette", "Duplicate a palette.", {
    id: { type: "string" },
    name: { type: "string" },
    newName: { type: "string" },
  }),
  tool("delete_palette", "Delete a palette (guards last palette).", {
    id: { type: "string" },
    name: { type: "string" },
  }),
  tool("rename_palette", "Rename a palette.", {
    id: { type: "string" },
    name: { type: "string" },
    newName: { type: "string" },
  }, ["newName"]),
  tool(
    "create_bank",
    "Create a bank from a template on the active palette. Query list_bank_templates first.",
    {
      templateName: { type: "string" },
      index: { type: "integer" },
    },
    ["templateName"]
  ),
  tool("duplicate_bank", "Duplicate a bank.", {
    id: { type: "string" },
    name: { type: "string" },
  }),
  tool("delete_bank", "Delete a bank.", {
    id: { type: "string" },
    name: { type: "string" },
  }),
  tool("rename_bank", "Rename a bank.", {
    id: { type: "string" },
    name: { type: "string" },
    newName: { type: "string" },
  }, ["newName"]),
  tool("save_bank_as_template", "Save the active (or named) bank as a custom template.", {
    id: { type: "string" },
    name: { type: "string" },
  }),
  tool("set_key", "Set Song/Palette key (SP setting).", {
    key: { type: "string", description: "e.g. C, F#, Bb" },
  }, ["key"]),
  tool("set_scale", "Set scale on the active voicing button.", {
    scale: { type: "string" },
  }, ["scale"]),
  tool("set_cymatic_scale", "Set scale on a voicing button by index (default active).", {
    scale: { type: "string" },
    index: { type: "integer" },
  }, ["scale"]),
  tool("clear_cymatic", "Clear (blank) a voicing button scale.", {
    index: { type: "integer" },
  }),
  tool("rotate_palette", "Rotate the active palette.", {
    delta: { type: "integer" },
    absolute: { type: "integer" },
  }),
  tool("rotate_bank", "Rotate the active bank.", {
    delta: { type: "integer" },
    absolute: { type: "integer" },
  }),
  tool("play_cymatic", "Play a voicing button by degree index 0–11.", {
    index: { type: "integer" },
  }, ["index"]),

  // --- Progression ---
  tool("delete_progression", "Delete a progression.", {
    name: { type: "string" },
    index: { type: "integer" },
  }),
  tool("rename_progression", "Rename a progression.", {
    name: { type: "string" },
    index: { type: "integer" },
    newName: { type: "string" },
  }, ["newName"]),
  tool(
    "generate_progression",
    "Create or reuse a named progression on the active palette and fill it with chord blocks. Never leaves an empty progression. Reuses an existing empty progression with the same name if present; otherwise creates a new named progression, activates it, and generates blocks.",
    {
      name: {
        type: "string",
        description: "Progression display name (required).",
      },
      blockCount: { type: "integer", description: "Number of blocks (default 8)." },
      bars: { type: "integer", description: "Alias for blockCount." },
      presetName: { type: "string", description: "Optional progression preset for weights." },
    },
    ["name"]
  ),

  // --- Tracks / sequencer / groove / mixer / plugins ---
  tool(
    "create_track",
    "Create a track on the active song. Pattern/Voicing/Sequencer auto-assign CymaSynth when available.",
    {
      type: {
        type: "string",
        enum: ["Pattern", "Voicing", "Sequencer", "Groove", "Aux"],
      },
      name: { type: "string" },
    },
    ["type"]
  ),
  tool("delete_track", "Delete a track.", trackRef),
  tool("rename_track", "Rename a track.", { ...trackRef, newName: { type: "string" } }, [
    "newName",
  ]),
  tool("apply_sequencer_template", "Apply a sequencer template to a Sequencer track.", {
    ...trackRef,
    templateName: { type: "string" },
  }, ["templateName"]),
  tool("apply_groove_template", "Apply a groove template to a Groove track.", {
    ...trackRef,
    templateName: { type: "string" },
  }, ["templateName"]),
  tool("save_sequencer_as_template", "Save track sequencer as a template.", {
    ...trackRef,
    name: { type: "string" },
  }, ["name"]),
  tool("save_groove_as_template", "Save track groove as a template.", {
    ...trackRef,
    name: { type: "string" },
  }, ["name"]),
  tool("set_sequencer_params", "Set basic sequencer knobs (swing, sustain, deviation, loop, reset, includeBass).", {
    ...trackRef,
    swing: { type: "integer" },
    sustain: { type: "integer" },
    deviation: { type: "integer" },
    loop: { type: "boolean" },
    reset: { type: "boolean" },
    includeBass: { type: "boolean" },
  }),
  tool("set_track_mixer", "Set mute, solo, fader (0–1), pan (0–1) on a track.", {
    ...trackRef,
    mute: { type: "boolean" },
    solo: { type: "boolean" },
    fader: { type: "number" },
    pan: { type: "number" },
  }),
  tool("set_track_send", "Set aux send 1 or 2 level/enabled/target.", {
    ...trackRef,
    sendIndex: { type: "integer", description: "1 or 2" },
    level: { type: "number" },
    enabled: { type: "boolean" },
    targetId: { type: "string" },
  }, ["sendIndex"]),
  tool(
    "set_track_instrument",
    "Set track plugin_identifier. Use \"cymasynth\" for the default CymaSynth id.",
    { ...trackRef, pluginId: { type: "string" } },
    ["pluginId"]
  ),
  tool("add_track_fx", "Append an audio FX plugin id to the track.", {
    ...trackRef,
    pluginId: { type: "string" },
  }, ["pluginId"]),
  tool("remove_track_fx", "Remove an audio FX plugin id from the track.", {
    ...trackRef,
    pluginId: { type: "string" },
    index: { type: "integer" },
  }),
  tool("add_track_midi_fx", "Append a MIDI FX plugin id.", {
    ...trackRef,
    pluginId: { type: "string" },
  }, ["pluginId"]),
  tool("remove_track_midi_fx", "Remove a MIDI FX plugin id.", {
    ...trackRef,
    pluginId: { type: "string" },
    index: { type: "integer" },
  }),
];

/**
 * Chat-mode tools: inspect + recommend only (no set_active, nav, plan, or mutators).
 */
const CHAT_TOOL_NAMES = new Set([
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
  "get_cymasynth_patch_summary",
]);

/**
 * @brief Returns tool schemas for the OpenAI completion call.
 * @param mode chat = read-only inspect/recommend; agent = full catalog (no create_progression).
 */
export function getAppAssistantTools(
  mode: "chat" | "agent" = "chat"
): OpenAI.Chat.ChatCompletionTool[] {
  if (mode === "chat") {
    return APP_ASSISTANT_TOOLS.filter((t) => {
      if (t.type !== "function") return false;
      return CHAT_TOOL_NAMES.has(t.function.name);
    });
  }
  return APP_ASSISTANT_TOOLS;
}
