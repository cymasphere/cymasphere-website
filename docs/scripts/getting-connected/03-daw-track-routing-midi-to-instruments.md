# DAW Track Routing: MIDI to Instruments

Goal

- Wire MIDI from Cymasphere to an instrument track for playback/record.

Steps (Logic)

1. Confirm Cymasphere plugin/virtual MIDI is the MIDI source for the instrument track.
2. Arm/monitor the instrument track; ensure the instrument plugin is loaded.
3. Record‑enable if capturing a region; play and verify meters.
4. Stop and play back the recorded region to confirm routing.

Tips

- Channel selection: if your instrument filters channels, match the sending channel or set it to Omni.

Troubleshooting

- No MIDI in: track input not set to the plugin/virtual port.
- No sound on playback: instrument loaded on different track; region on wrong track.


