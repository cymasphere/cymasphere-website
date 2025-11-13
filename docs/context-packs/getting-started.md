# Context Packs: 1. Getting Started (Logic Plugin Default)

Scope and assumptions

- Cymasphere is used as a plugin in Logic Pro by default (except platform-specific Getting Connected videos).
- Music theory is taught in separate videos; these scripts focus surgically on functionality and lead with a motivating use case.
- Sources referenced: live DB (tutorial_playlists, playlist_videos, tutorial_videos, video_scripts), CYMASPHERE_FEATURE_CATALOG.md, PREREQUISITE_ASSESSMENT_GUIDE.md.

Playlist metadata (from DB)

- Playlist: 1. Getting Started (id: d253bd66-d613-4a1e-b3b7-1c63375dfdb5)
- Ordered videos (sequence_order → title, duration, YT id if present):
  1 → Welcome to Cymasphere (180s, YT fJ9rUzIMcZQ)
  2 → Workspace: Songs, Tracks, Palettes (240s, YT YQHsXMglC9A)
  3 → Create Your First Project (120s, YT 9bZkp7q19f0)
  4 → Audio Setup Basics (300s, YT kJQP7kiw5Fk)
  5 → Topbar Navigation (3s)
  6 → Song Tab (4s)
  7 → Track Tab (4s)
  8 → Palette Tab (4s)
  9 → Voicing Tab (4s)
  10 → User Menu (3s)
  11 → Breadcrumbs Navigation (2s)
  12 → Layer Manager (4s)

General Logic plugin context (used where relevant)

- Instantiate Cymasphere on a MIDI/Utility/External Instrument track as a MIDI FX or instrument plugin (per host mapping).
- Route MIDI from Cymasphere track to a Software Instrument track (enable MIDI FX routing where applicable) and verify meter activity.
- Use I/O labels and region record-arm/monitor to confirm playback.
- Troubleshooting: no sound (instrument track not armed/monitoring, wrong MIDI input, buffer too large, plugin inserted on audio track).

Formatting of each context pack

- Use case (1–2 lines)
- Learning objectives (3–5 bullets)
- Interfaces to show (exact names)
- In-app steps (Logic plugin where relevant)
- Logic-specific steps (instantiation/routing/verification) when applicable
- Prerequisites (link to theory/tech primers as needed)
- Pitfalls/Troubleshooting (2–4 items)
- Source references (files or catalog sections)
- Draft script outline (Hook → Location → Demonstration → Explanation → Practice → Related)

---

1) Welcome to Cymasphere

- Use case: “I want to quickly see what Cymasphere can do and how to navigate it in Logic.”
- Learning objectives:
  - Understand what Cymasphere does at a high level
  - Identify main tabs: Song, Track, Palette, Voicing
  - Know where to access Help and Settings
  - See where to start next (Workspace, First Project)
- Interfaces to show:
  - Topbar Navigation (Feature Catalog 3.1)
  - Tabs: Song Tab (3.2), Track Tab (3.3), Palette Tab (3.4), Voicing Tab (3.5)
  - User Menu (3.7)
  - Chord/Scale Display (1.3), Keyboard Display (10.4)
- In-app steps:
  1. Open a project with Cymasphere loaded (Logic plugin)
  2. Brief tour of Topbar and Tabs; point to User Menu → Help/About
  3. Show Chord/Scale and Keyboard displays to preview output
  4. Point to next videos in the playlist
- Logic-specific:
  - Ensure Cymasphere is inserted on a suitable track and an instrument track is available for sound verification (meters moving)
- Prerequisites: none
- Pitfalls/Troubleshooting:
  - Confusing plugin vs audio track insertion → ensure MIDI-capable slot
  - No output because instrument track is not monitoring
- Source references:
  - Feature Catalog: 3.1 Topbar, 3.2–3.5 Tabs, 3.7 User Menu, 1.3 Chord/Scale, 10.4 Keyboard
- Draft script outline:
  - Hook: What you can accomplish today with Cymasphere in Logic
  - Location: Topbar, Tabs, User Menu
  - Demonstration: Quick tour + visual output indicators
  - Explanation: Role of each tab and where help/settings live
  - Practice: Explore tabs; open Help/About
  - Related: “Workspace”, “Create Your First Project”

---

2) Workspace: Songs, Tracks, Palettes

- Use case: “I need a clear mental model of how Songs, Tracks, and Palettes relate in Cymasphere.”
- Learning objectives:
  - Understand Song → Track → Palette → Voicing hierarchy
  - Know where to perform song-level vs track-level actions
  - Recognize Palette role for storing voicings (cymatics/expressions)
- Interfaces to show:
  - Song Tab (3.2): browser/properties
  - Track Tab (3.3): track list/types/properties
  - Palette Tab (10.3, 10.8): cymatic buttons, expressions, banks
  - Voicing Tab (1.x group): voice count, octave, spacing, inversion, sustain, strum, smart chord, voice leading
- In-app steps:
  1. Open Song Tab → show song context
  2. Switch to Track Tab → show track list and types
  3. Switch to Palette Tab → show cymatic buttons and expressions
  4. Switch to Voicing Tab → show core voicing controls
- Logic-specific: none (navigation only)
- Prerequisites: none (theory references deferred to theory videos)
- Pitfalls/Troubleshooting:
  - Expecting voicing edits in Song/Track tabs (remind: Voicing Tab)
  - Confusing Palette storage (clarify cymatics/expressions)
- Source references:
  - Feature Catalog: 3.2–3.5, 10.3 Cymatic Buttons, 10.8 Expressions, 1.x Voicing features
- Draft script outline:
  - Hook: Why separating Song/Track/Palette saves time
  - Location: Song/Track/Palette/Voicing Tabs
  - Demonstration: Navigate and point to responsibilities
  - Explanation: Data flow and where tasks live
  - Practice: Identify where you’d go to change X vs Y
  - Related: “Create Your First Project”, “Voicing Tab”

---

3) Create Your First Project

- Use case: “I want to create a song, add a track, and hear something quickly.”
- Learning objectives:
  - Create a new song project and save it
  - Add a basic track and verify playback
  - Understand where projects live
- Interfaces to show:
  - Song Tab (New Song, Song Menu)
  - Track Tab (track creation, types)
  - Transport & Timeline (6.x): Play, Loop, Timeline
- In-app steps:
  1. Song Tab → New Song → name and save
  2. Track Tab → Add a track (voicing track)
  3. Transport → Play to verify output (meters)
- Logic-specific:
  - Ensure plugin track routes MIDI to a Software Instrument; arm/monitor the instrument track
- Prerequisites: basic Logic track creation familiarity (provide tip in-script)
- Pitfalls/Troubleshooting:
  - No sound: instrument track not routed/armed
  - Project not saved → show where save lives
- Source references:
  - Feature Catalog: 6.1 Play Button, 6.2 Timeline, 4.2 New Song Button, 4.1 New Track Button
- Draft script outline:
  - Hook: Make your first sound in under 2 minutes
  - Location: Song/Track Tabs, Transport
  - Demonstration: Create → add track → play
  - Explanation: Where files and tracks are managed
  - Practice: Create a second track and play
  - Related: “Audio Setup Basics”

---

4) Audio Setup Basics

- Use case: “I need reliable audio and MIDI routing in Logic with Cymasphere as a plugin.”
- Learning objectives:
  - Select output device, set buffer/sample rate
  - Route MIDI from Cymasphere to a Software Instrument
  - Verify meters and fix common issues
- Interfaces to show:
  - Audio Settings Window (17.1)
  - MIDI Mapping basics; Voice Channel Matrix (15.1 overview)
  - Transport meters and instrument channel meters
- In-app steps:
  1. Open Audio Settings → choose output device, sample rate, buffer size
  2. Logic routing: plugin track (Cymasphere) → Software Instrument track; monitor/arm
  3. Play a chord to verify meters; adjust buffer if latency high
- Logic-specific:
  - Ensure plugin is in a MIDI-capable slot (not audio insert)
  - Confirm instrument track input and monitoring
- Prerequisites: none
- Pitfalls/Troubleshooting:
  - No sound: wrong track type or monitoring off
  - Latency: too-large buffer; reduce
  - Clipping: instrument channel too hot; gain-stage
- Source references:
  - Feature Catalog: 17.1 Audio Settings, 15.1 Voice Channel Matrix
- Draft script outline:
  - Hook: Hear clean, responsive sound in Logic
  - Location: Audio Settings, routing overview
  - Demonstration: Device/buffer + routing + meter check
  - Explanation: Why buffer/sample rate matter
  - Practice: Toggle buffer sizes to feel latency differences
  - Related: “Getting Connected” series

---

5) Topbar Navigation (short)

- Use case: “Find global controls fast.”
- Learning objectives: Identify Topbar elements; switch tabs
- Interfaces: Topbar (3.1); Tabs
- Steps: Point and click demo; show quick access to Help via User Menu
- Pitfalls: Expecting deep edits here (redirect to tabs)
- Sources: Feature Catalog 3.1
- Outline: Hook → Quick tour → Practice: switch tabs

---

6) Song Tab (short)

- Use case: “Manage songs and properties.”
- Objectives: Locate song browser/properties; find song actions
- Interfaces: Song Tab (3.2)
- Steps: Show browser, properties, Song Menu
- Pitfalls: Editing tracks here (remind: Track Tab)
- Sources: Feature Catalog 3.2
- Outline: Hook → Show areas → Practice: open properties

---

7) Track Tab (short)

- Use case: “Manage tracks fast.”
- Objectives: Recognize track list/types; solo/mute; sequencer access
- Interfaces: Track Tab (3.3), Sequencer access (9.x overview)
- Steps: Add track; show solo/mute; open sequencer
- Pitfalls: Expect instrument sound without routing (remind Logic routing)
- Sources: Feature Catalog 3.3, 9.x
- Outline: Hook → Actions → Practice: add one track

---

8) Palette Tab (short)

- Use case: “Store and recall voicings.”
- Objectives: Use cymatic buttons; manage expressions/banks
- Interfaces: Palette Tab; Cymatic Buttons (10.3); Expressions (10.8)
- Steps: Trigger cymatic; open expression window; duplicate expression
- Pitfalls: Thinking palette edits change song-level settings
- Sources: Feature Catalog 10.3, 10.8
- Outline: Hook → Demo → Practice: make a new expression

---

9) Voicing Tab (short)

- Use case: “Shape chord sound quickly.”
- Objectives: Adjust voice count, octave, spacing, inversion; try sustain/strum/smart chord/voice leading
- Interfaces: 1.1 Voice Count; 1.2 Spacing; 1.12 Inversion; 1.8 Sustain; 1.9 Strum; 1.10 Smart Chord; 1.6 Voice Leading; 10.4 Keyboard Display
- Steps: Change voice count and octave; toggle sustain/strum; preview on keyboard
- Pitfalls: Over-dense voicings (use voice count/spacing)
- Sources: Feature Catalog 1.x, 10.4
- Outline: Hook → Demo chain → Practice: create two contrasting voicings

---

10) User Menu (short)

- Use case: “Find settings and help.”
- Objectives: Open preferences/help/about
- Interfaces: User Menu (3.7)
- Steps: Show menu; open Help/About; note preferences
- Pitfalls: Expecting audio prefs here (point to Audio Settings)
- Sources: Feature Catalog 3.7
- Outline: Hook → Show → Practice: open About

---

11) Breadcrumbs Navigation (short)

- Use case: “Know where you are and jump quickly.”
- Objectives: Read and click breadcrumbs
- Interfaces: Breadcrumbs (5.1)
- Steps: Navigate via breadcrumbs
- Pitfalls: None
- Sources: Feature Catalog 5.1
- Outline: Hook → Demo → Practice: jump back via breadcrumb

---

12) Layer Manager (short)

- Use case: “Organize composition layers.”
- Objectives: Toggle visibility, order, and lock layers
- Interfaces: Layer Manager (5.2–5.4)
- Steps: Show layer visibility/order/lock; quick workflow tip
- Pitfalls: Editing wrong layer (lock/unlock explicitly)
- Sources: Feature Catalog 5.2–5.4
- Outline: Hook → Demo → Practice: reorder two layers

---

Notes on theory separation

- Any theory prerequisite (scales, chord qualities, inversions) is redirected to designated theory videos. These context packs avoid theory deep-dives and focus on functional steps and verification.







