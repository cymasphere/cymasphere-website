# Audio Setup Basics (Logic)

Goal

- Get clean, responsive audio and correct MIDI routing.

What you’ll do

- Set output device, sample rate, buffer size; route MIDI Cymasphere → Software Instrument; verify meters.

Steps

1. Cymasphere → Audio Settings: select your output device; set sample rate; choose buffer size (start 128–256 samples).
2. Logic routing: ensure Cymasphere is on a MIDI‑capable insert; route its MIDI to a Software Instrument; arm/monitor the instrument track.
3. Trigger a cymatic (Palette) or play a voicing (Voicing) → confirm meters on the instrument track.
4. Adjust buffer if latency is high; confirm no clipping on the instrument channel.

Troubleshooting

- No sound: wrong insert slot, instrument track not monitoring, or MIDI routing missing.
- High latency: reduce buffer size.
- Distortion: lower instrument channel gain or plugin output.


