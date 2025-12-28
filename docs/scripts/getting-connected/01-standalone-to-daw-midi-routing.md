# Standalone to DAW: MIDI Routing

Goal

- Control your DAW instruments from Cymasphere Standalone using virtual MIDI.

Steps

1. Cymasphere Virtual Output is enabled by default—no setup needed!
2. In Cymasphere Standalone → set MIDI Out to "Cymasphere Virtual Output".
3. In your DAW (Logic): create a Software Instrument track → set its MIDI input to "Cymasphere Virtual Output" → arm/monitor.
4. In Cymasphere, trigger a voicing → verify the instrument track meters move and sound plays.

Tips

- Use a simple piano instrument first to verify routing.
- Cymasphere Virtual Output is automatically available—no additional software installation required.

Troubleshooting

- No port in DAW: restart the DAW to refresh MIDI device list.
- No sound: track not monitoring/armed; wrong input; instrument not loaded.


