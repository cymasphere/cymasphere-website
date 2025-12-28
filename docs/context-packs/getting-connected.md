# Context Packs: 2. Getting Connected

Scope and assumptions

- Cover both Standalone→DAW virtual‑MIDI routing and Plugin mode in major DAWs.
- Default examples use Logic; note host differences where relevant.
- Minimal theory; focus on routing, verification, and fixes.

Playlist metadata (from DB)

1. Standalone to DAW: MIDI Routing — virtual MIDI (App mode: standalone)
2. Plugin Setup in DAW — insert AU/VST3, route to instrument (plugin)
3. DAW Track Routing: MIDI to Instruments — track I/O and record/monitor (both)
4. Cymasphere Tracks: MIDI Out — per‑track MIDI out, bass channel, voice/channel matrix (both)
5. Verify & Troubleshoot — quick checks and common fixes (both)

Per‑video context packs

1) Standalone to DAW: MIDI Routing

- Use case: Use Cymasphere Standalone to control instruments in your DAW via virtual MIDI.
- Objectives:
  - Use Cymasphere Virtual Output (enabled by default).
  - Set Cymasphere MIDI Out → Cymasphere Virtual Output.
  - Set DAW MIDI In → Cymasphere Virtual Output on an instrument track; verify meters.
- Interfaces to show: Cymasphere MIDI Out selector; DAW track input/monitor.
- Steps:
  1. Cymasphere Virtual Output is enabled by default—no setup needed!
  2. Cymasphere Standalone → set MIDI Out to "Cymasphere Virtual Output".
  3. DAW: create Software Instrument track with MIDI input from "Cymasphere Virtual Output"; arm/monitor.
  4. Play a voicing; confirm meters and sound.
- Pitfalls/Fixes: No virtual port; DAW input not set; track not monitoring.
- References: Feature Catalog 15.1 (routing overview); DAW docs for virtual MIDI.

2) Plugin Setup in DAW

- Use case: Use Cymasphere as a plugin and route its MIDI to an instrument track.
- Objectives:
  - Insert AU/VST3 in a MIDI‑capable slot.
  - Route plugin MIDI → instrument; verify meters.
- Interfaces to show: DAW plugin insert; instrument track input/monitor.
- Steps:
  1. Insert Cymasphere as MIDI FX/Instrument plugin per host.
  2. Create a Software Instrument track to receive plugin MIDI.
  3. Arm/monitor; play voicings; verify meters.
- Pitfalls/Fixes: Inserted on audio slot; instrument not monitoring.
- References: Feature Catalog 17.1/15.1 (device/routing overview).

3) DAW Track Routing: MIDI to Instruments

- Use case: Wire MIDI tracks and instruments for reliable playback/record.
- Objectives:
  - Correct track inputs/outputs.
  - Record‑enable/monitor; choose channels when needed.
- Interfaces: DAW I/O, monitor/record buttons.
- Steps:
  1. Set MIDI input to Cymasphere source (plugin/virtual MIDI).
  2. Output to the instrument; arm/monitor.
  3. Record a region; play back to verify.
- Pitfalls/Fixes: Wrong input; monitoring off; channel mismatches.

4) Cymasphere Tracks: MIDI Out

- Use case: Control track MIDI outputs (per‑track), set bass channel, use the voice/channel matrix.
- Objectives:
  - Per‑track MIDI out settings; designate bass channel.
  - Understand the voice→channel matrix.
- Interfaces: Track properties (MIDI out), Voice Channel Matrix.
- Steps:
  1. Open track MIDI out settings; set desired channel.
  2. Set bass channel if needed.
  3. Open Voice Channel Matrix to map voices → channels.
- Pitfalls/Fixes: Unexpected channels; DAW instrument not listening to selected channel.
- References: Feature Catalog 15.1.

5) Verify & Troubleshoot

- Use case: Quickly diagnose routing problems.
- Checklist:
  - Virtual MIDI/I/O exists and is selected.
  - Plugin is in a MIDI‑capable slot.
  - Instrument track armed/monitoring.
  - Meters move in both Cymasphere and the instrument channel.
  - Buffer size appropriate (latency vs stability).
- Common fixes: Reassign I/O; toggle monitor/record; reduce buffer; check channel filters.


