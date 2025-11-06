# Standalone to DAW: MIDI Routing

Goal

- Control your DAW instruments from Cymasphere Standalone using virtual MIDI.

Steps (macOS example)

1. Open Audio MIDI Setup → Window → Show MIDI Studio → double‑click IAC Driver → enable Device; add a Port if needed.
2. In Cymasphere Standalone → set MIDI Out to the IAC port you enabled.
3. In your DAW (Logic): create a Software Instrument track → set its MIDI input to the IAC port → arm/monitor.
4. In Cymasphere, trigger a voicing → verify the instrument track meters move and sound plays.

Tips

- Use a simple piano instrument first to verify routing.
- Name your IAC port clearly (e.g., “Cymasphere IAC”).

Troubleshooting

- No port in DAW: re‑enable IAC or restart the DAW.
- No sound: track not monitoring/armed; wrong input; instrument not loaded.


