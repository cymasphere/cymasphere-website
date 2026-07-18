# Cymasphere & CymaSynth knowledge (User Manuals)

Authoritative product documentation compiled from the Cymasphere and CymaSynth User Manuals.
For product features, workflows, controls, and examples, use only this document.

# Part 1 — Cymasphere User Manual

<!-- About.tsx -->
# About

/**
 * @fileoverview About chapter for the Cymasphere User Manual.
 * @module sections/About
 */
import { memo } from 'react';
import { ManualLink } from '../components/ManualLink';
import { getCymasphereVersion, MANUAL_VERSION } from '../version';
import { RelatedLinks } from './RelatedLinks';

/**
 * @brief Shows manual version, product version, and ownership information.
 * @returns JSX content for the About section.
 */
export const About = memo(function About() {
 const year = new Date().getFullYear();
 const version = getCymasphereVersion();

 return (
 <>

## About



 **Cymasphere User Manual** v{MANUAL_VERSION} documents Cymasphere v{version}. It is written for
 composers, producers, and engineers using Cymasphere as a standalone app or AU/VST3 plugin.




 This first manual pass is organized around the current Cymasphere 2.1.x product surface: harmonic composition,
 track editing, plugin hosting, CymaSynth integration, 
 virtual MIDI, 
 notation, and export.



Copyright {year} NNAudio. All rights reserved.

---

<!-- BigPicture.tsx -->
# Big Picture

<>

## What Cymasphere Is



 Cymasphere is a harmonic composition workstation: it helps you design progressions, perform voicing buttons, generate
 MIDI, host instruments, mix sounds, view notation, and route ideas into a DAW.




### The Core Idea



 Cymasphere separates **musical intent** from **sound production**. You choose harmonic
 material in PALETTE and 
 VOICING, Cymasphere turns that material into MIDI, then the MIDI plays
 CymaSynth, a third-party plugin, a DAW instrument, or an external destination.



 
 
 Song
 
 
 Palette
 
 
 Voicing
 
 
 Track
 
 
 Sound
 
 


### Cymasphere, CymaSynth, And Your DAW



 


 Piece	
 What It Does	
 Where To Go Deeper	
 






 Cymasphere	
 Composes, performs, records, routes, mixes, notates, and exports harmonic material.	
 This manual.	
 


 CymaSynth	
 Provides a bundled synthesizer for Cymasphere tracks and can also run as its own app/plugin.	
 
 Plugin Hosting & CymaSynth plus the CymaSynth User Manual
 for oscillators, filters, modulation, FX, and presets.
 
 


 DAW / Host	
 Owns plugin insertion, host transport, MIDI routing, and final production workflow when Cymasphere is hosted.	
 
 Your DAW's MIDI routing documentation plus 
 MIDI & Controller Routing and 
 Sound & Routing.
 
 






### Standalone Vs Plugin



 - 
 **Standalone:** Cymasphere owns audio/MIDI settings, virtual MIDI output, hosted instruments, the 
 MIXER view, and audio export workflows.


 - 
 **Plugin:** Your DAW owns audio devices, plugin hosting context, transport integration, and mixer
 routing. Cymasphere focuses on harmonic performance and MIDI generation.

---

<!-- ControlFeatureIndex.tsx -->
# Control Feature Index

<>

## Control And Feature Index



 Use this as the manual's exhaustive lookup map. It mirrors Cymasphere's contextual-help taxonomy and points
 you toward the chapter that explains each feature family. Pair it with the 
 Menu & Action Index and 
 Reference appendix for shortcuts and glossary terms.

---

<!-- CoreViews.tsx -->
# Core Views

<>

## Core Views



 The main view tabs are the manual's primary map. Learn them in this order: 
 SONG for structure, 
 PALETTE for harmonic material, 
 VOICING for note generation, 
 TRACK for editing, and 
 MIXER for standalone sound/routing.





 


 View	
 Purpose	
 Use It For	
 Availability	
 




 {viewReferences.map((view) => (


 
 {view.label}
 
 {view.purpose}	
 {view.useFor}	
 {view.availability}	
 
 ))}






### How To Move Through Views



 - Use the topbar tabs for direct navigation.

 - 
 Press **Tab** for the next view or **Shift + Tab** for the previous view.


 - 
 Use SONG and TRACK together:
 SONG selects context; TRACK edits the selected track.


 - 
 Use PALETTE and VOICING 
 together: PALETTE chooses harmony; VOICING decides how it becomes notes.

---

<!-- CreationTools.tsx -->
# Creation Tools

<>

## Creation Tools



 Cymasphere's modal tools are focused workspaces. They appear when you need to create, generate, inspect, or
 route musical material without losing the main view context. See 
 Secondary Windows Reference for window-by-window detail.





 


 Tool	
 Use It For	
 






 Chord / Scale Window	
 
 Choosing harmonic context and pitch vocabulary, with staff or harmony-clock previews. See 
 Harmony & Voicing and 
 Secondary Windows.
 
 


 Layer Manager	
 
 Managing track layers and layer-specific musical context. See 
 Layers & Expressions.
 
 


 Voice / Channel Matrix	
 
 Routing voices to MIDI channels and destinations. See 
 MIDI & Controller Routing.
 
 


 Sequencer Window	
 
 Editing sequencer patterns, repeats, and generated rhythmic material. See 
 Sequencer.
 
 


 Generate Progression	
 
 Creating harmonic progressions with reusable preset settings. See 
 Generate Progression.
 
 


 Generate Groove / Groove Presets	
 
 Building rhythmic accompaniment from groove styles and templates. See 
 Groove Tracks.
 
 


 Controller Assignments	
 
 Mapping hardware or external MIDI controls to Cymasphere actions. See 
 MIDI & Controller Routing.
 
 


 MIDI Monitor	
 
 Verifying incoming, outgoing, and transport-related MIDI messages. See 
 MIDI & Controller Routing.
 
 






### Generation Strategy



 Use generation tools to make a strong first draft, then return to 
 SONG, TRACK, 
 PALETTE, and VOICING for
 musical editing. Generated material is most useful when you treat it as editable composition material rather than
 a final answer.

---

<!-- ExportNotationGuide.tsx -->
# Export Notation Guide

/**
 * @fileoverview Deep notation, MIDI handoff, and audio export guide.
 * @module sections/ExportNotationGuide
 */
import { memo } from 'react';
import { ManualLink } from '../components/ManualLink';
import { trackTypeReferences } from '../data/reference';
import { RelatedLinks } from './RelatedLinks';

/**
 * @brief Documents notation rendering, Copy as MIDI, audio bounce, stems, and export troubleshooting.
 * @returns JSX content for the Export and Notation section.
 */
export const ExportNotationGuide = memo(function ExportNotationGuide() {
 const patternTrack = trackTypeReferences.find((t) => t.type === 'Pattern');
 const voicingTrack = trackTypeReferences.find((t) => t.type === 'Voicing');
 const sequencerTrack = trackTypeReferences.find((t) => t.type === 'Sequencer');
 const grooveTrack = trackTypeReferences.find((t) => t.type === 'Groove');

 return (
 <>

## Export, Stems, MIDI, And Notation



 Cymasphere can hand off work as notation, MIDI, full-mix audio, or selected-track audio. Choose the handoff
 format based on what should remain editable after leaving Cymasphere. For menu locations see 
 Menu & Action Index; for routing context see 
 MIDI & Controller Routing.




### Notation View



 Notation View renders selected track material through LilyPond. It is best for Pattern, Voicing, and Sequencer
 tracks with renderable note content. Groove and Aux tracks do not currently provide notation. Open it from track
 menus or see Notation & Export for the overview.




 


 Control	
 Purpose	
 






 Staff Type	
 Chooses staff layout, such as single staff or grand staff where supported.	
 


 Show Key Signature	
 Displays or hides the key signature in the rendered score.	
 


 Bars / System	
 Controls how many bars appear on each notation system.	
 


 Zoom	
 Scales the rendered notation view for reading or inspection.	
 






### Copy As MIDI



 Copy as MIDI places generated or stored notes on the clipboard for DAW handoff. Use it when you want to keep
 editing the notes in another app.




 - 
 **
 {patternTrack && Pattern}:
 ** 
 Copies stored editable notes (see Pattern Editor).


 - 
 **
 {voicingTrack && Voicing}:
 ** 
 Copies generated notes derived from progression and voicing settings.


 - 
 **
 {sequencerTrack && Sequencer}:
 ** 
 Copies generated sequencer notes.


 - 
 **
 {grooveTrack && Groove} / Aux:
 ** 
 Not supported in current menus/workflows.






### Audio Bounce



 


 Bounce Type	
 What It Captures	
 Use It When	
 






 Output 1-2	
 
 The full standalone mix through instruments, effects, auxes, and master output (see 
 MIXER View).
 
 You want a reference or final render from Cymasphere.	
 


 Selected Track	
 
 One track/stem through its instrument and relevant processing path (see 
 Plugin Hosting & CymaSynth).
 
 You want to continue arranging or mixing in a DAW.	
 






### Formats



 - **WAV:** Best general-purpose lossless export.

 - **AIFF:** Useful for Apple-centric audio workflows.

 - **MP3:** Smaller lossy export when the bundled encoder is available.

 - **Split channels:** Useful when downstream tools need separate left/right files.





### Background Export



 Audio export runs as a background job with progress updates. Avoid changing audio devices, closing hosted plugin
 editors, or editing routing while an export is running. If you need to change the mix, cancel or wait for the
 current export to finish.




### Troubleshooting Export



 


 Problem	
 Likely Cause	
 Fix	
 






 Notation is empty	
 The selected track has no renderable notes or is an unsupported type.	
 
 Use Pattern, 
 Voicing, or 
 Sequencer material with calculated/stored notes.
 
 


 MP3 unavailable	
 The encoder is not present in the current build.	
 Export WAV/AIFF or use a release build with the bundled encoder.	
 


 Stem is silent	
 The selected track is muted, unrouted, missing an instrument, or an Aux/Groove limitation applies.	
 
 Check MIXER meters, instrument slot, mute/solo, and 
 track type support.
 
 


 Notation render fails	
 LilyPond is unavailable or cannot render the generated content.	
 Use the bundled Mac standalone build where available, or verify the notation source track.

---

<!-- GenerateProgressionGuide.tsx -->
# Generate Progression Guide

<>

## Generate Progression



 Generate Progression helps you create a harmonic draft quickly, then refine it like any other progression.
 Treat it as a composition assistant: useful for starting points, variations, and style exploration, not as a
 replacement for listening and editing. Open it from the 
 Transport & Progressions workflow or 
 Creation Tools.




### When To Use It



 - You need a first progression before designing tracks.

 - You want several harmonic alternatives for the same song section.

 - 
 You want to bias the result toward certain banks, 
 voicing behaviors, or harmonic functions.


 - You want reusable generation settings for a genre, client, cue, or writing session.





### Opening Generate Progression



 Open it from the progression menu with **GENERATE**, or from an empty progression/timeline context
 where the app offers a generate action. The generated result becomes editable progression material after it is
 created.




### Generation Presets



 


 Preset Action	
 Use It For	
 






 Select preset	
 Recall a saved generation setup before creating a new progression.	
 


 Save	
 Update the current preset with your latest settings.	
 


 Save As	
 Create a new named preset without replacing the current one.	
 


 Rename / Delete	
 Keep your preset list organized as styles evolve.	
 






### Weights And Biases



 Generation settings can bias what Cymasphere chooses. Bank weights influence which harmonic banks appear in 
 PALETTE — using the **default bank template names** listed under Default Bank Templates (e.g. MODES OF MAJOR, COMPOSITE MINOR, SECONDARY DOMINANT). Voicing weights influence which musical behaviors are
 favored. Use high weights for material you want more often and low weights for material that should remain rare.




 - **Genre or style presets:** Save different weight sets for jazz, cinematic, pop, modal, or experimental work.

 - **Section presets:** Save verse, chorus, bridge, and outro generation behaviors separately.

 - **Client or cue presets:** Save reliable settings for repeatable production contexts.





### After Generation



 - Play the progression before editing individual blocks.

 - Delete weak blocks instead of trying to rescue every generated choice.

 - Resize important chords to create phrase shape.

 - 
 Use PALETTE and 
 VOICING to make generated harmony playable.


 - Save the progression as a variation when it is worth keeping.





### Manual Editing Vs Generation



 


 Use Generate Progression When...	
 Edit Manually When...	
 






 You need options, speed, or surprise.	
 You already know the exact harmonic move you want.	
 


 You are exploring a style or harmonic tendency.	
 You are matching picture, lyrics, arrangement hits, or a fixed cue length.	
 


 You want to reuse a preset strategy.	
 You are correcting voice-leading or phrase rhythm one block at a time.

---

<!-- GettingStarted.tsx -->
# Getting Started

<>

## First Session



 Start with one simple path: confirm audio/MIDI, select a track, choose harmonic material, then route the result
 to a sound. You can add notation, 
 export, 
 plugin hosting, and DAW routing after the basic loop feels clear.




### How To Use This Manual



 Use the Contents sidebar to jump between chapters. Wiki-style links throughout the manual point to related
 sections — start with the Control & Feature Index when you
 know a feature name but not which chapter explains it.




 


 Part	
 Chapters	
 




 {getSectionsByPart().map(([part, sections]) => (


 {part}	
 
 section.id)} />
 
 
 ))}






### First-Launch Checklist



 - 
 Open Cymasphere as either the **standalone app** or an **AU/VST3 plugin**.


 - 
 In standalone, open the profile menu and choose **AUDIO / MIDI SETTINGS** to select your output
 and MIDI input device (see Settings, Help & Account). In plugin
 mode, configure the DAW track instead.


 - 
 Use SONG to choose the song or track context you want to hear.


 - 
 Use PALETTE to select a harmonic bank or voicing button.


 - 
 Use VOICING to shape the notes Cymasphere generates from the current
 harmony.


 - 
 Use TRACK or MIXER to pick the
 instrument that will play the result.






### Recommended First Sound



 Cymasphere 2.1.x is designed to find CymaSynth automatically after installation. If CymaSynth is available, use
 it for your first track because it gives you a known-good instrument without needing third-party plugin setup
 (see Plugin Hosting & CymaSynth).




### When You Are In A DAW



 Treat Cymasphere like a MIDI-generating instrument. Arm the host track, make sure MIDI reaches Cymasphere, and
 route Cymasphere's MIDI output according to the DAW's rules (see 
 MIDI & Controller Routing). Some hosts expose MIDI FX or
 side-chain style routing; others require separate tracks.




### Account And Restore



 The profile menu includes **MANAGE ACCOUNT**, **LOGOUT**, and **RESTORE**.
 Use account actions for subscription/session management, and use Restore only when you need database recovery
 tools for local Cymasphere data (see Settings, Help & Account).

---

<!-- GrooveGuide.tsx -->
# Groove Guide

<>

## Groove Tracks




 Groove tracks are rhythmic lane/step tracks. They are best for drums, percussion, accents, and
 generated rhythm patterns. They output MIDI directly on one selected channel and do not use the
 Voice / Channel Matrix (see MIDI & Controller Routing).
 Edit grooves from TRACK View or create them in 
 SONG View.




### Groove Grid




 


 Element	
 Meaning	
 






 Lane	
 A row with its own name, MIDI note, mute state, and step pattern.	
 


 Step	
 A hit in a lane at a timeline position. Click to toggle; drag to draw where supported.	
 


 Lane MIDI note	
 The pitch sent when a step in that lane plays.	
 


 Lane mute / solo	
 Controls individual lane playback inside the groove.	
 


 Track MIDI out	
 One channel, CH 1-16, used by all lanes in the groove track.	
 






### Groove Track Header




 - **M/S:** Mutes or solos the entire groove track (also available in MIXER).

 - **GENERATE:** Opens Generate Groove (see Creation Tools).

 - **PRESETS:** Opens groove preset loading/saving.

 - **MIDI OUT:** Chooses the output MIDI channel for all lanes.

 - **DYNAMICS:** Shapes groove velocity variation.

 - 
 **INSTRUMENT:** Chooses the hosted instrument that plays the groove MIDI (see 
 Plugin Hosting & CymaSynth).


 - 
 **AUTOMATION:** Eye toggle + parameter dropdown in the header bar (right of
 INSTRUMENT) for pitch bend / CC / aftertouch; the lane stays under the grid (see 
 TRACK View).






### Generate Groove Controls




 


 Control	
 What It Shapes	
 






 Style	
 Genre or rhythmic vocabulary such as rock, funk, jazz, latin, electronic, or world patterns.	
 


 Elements	
 Which lanes/instruments to include: kick, snare, hats, toms, percussion, and similar elements.	
 


 Complexity	
 How intricate the generated rhythm should be.	
 


 Density	
 How many hits appear in the pattern.	
 


 Feel	
 Whether the groove leans ahead of or behind the beat.	
 


 Swing	
 How much off-beat timing is shifted for swing feel.	
 


 Humanize	
 Timing and velocity looseness.	
 


 Fills	
 How often phrase-end fill behavior appears.	
 


 Phrase / Groove Length	
 How long the generated phrase and overall groove should be.	
 


 Region	
 Which target region receives or replaces generated content.	
 






### Groove Presets




 Use Groove Presets when you want to reuse a rhythmic pattern across songs or sections. Save a
 groove after editing lanes and steps; load it when another track needs the same rhythmic
 foundation. See Menu & Action Index for SAVE AS GROOVE PRESET.




### Limitations




 - Groove tracks do not use the Voice / Channel Matrix.

 - 
 Groove tracks do not support Copy as MIDI, Audio Export, or Notation View in current menus (see 
 Export, Stems, MIDI & Notation).


 - 
 Groove tracks are rhythmic/percussive; they do not follow chord voicing the way 
 Voicing or 
 Sequencer tracks do.


 - 
 Ghost Track silences groove chart playback (see 
 Transport & Progressions).

---

<!-- HarmonyVoicing.tsx -->
# Harmony Voicing

<>

## Harmony And Voicing



 Voicing is where Cymasphere turns a chord symbol or voicing button into playable notes. Think of it as the musical
 translator between theory and MIDI: it decides spelling, register, spacing, motion, density, and expression. The
 detailed controls live in VOICING and 
 Voicing Controls In Detail.



 
 

### Pitch Context



 **Key**, **Scale**, **Chord**, and **Quality** define
 the harmonic identity Cymasphere is working from.


 
 

### Register And Shape



 **Inversion**, **Bass**, **Octave**, **Spacing**, and
 **Voice Count** control where notes sit and how thick the voicing is.


 
 

### Motion



 **Voice Lead** favors smoother movement between chords. Smart Chord helps choose practical
 chord tones for performance.


 
 

### Expression



 **Dynamics**, **Strum**, and **Sustain** make generated notes feel
 performed instead of merely calculated. See Layers & Expressions 
 for expression variations.


 
 


### Suggested Workflow



 - 
 Pick the key and scale first in PALETTE so spelling and harmonic
 labels make sense. Open the Chord / Scale picker when you need to browse families; use the staff or clock
 preview there (see Secondary Windows). Full score export is
 separate in Notation.


 - Choose chord quality and inversion for the basic sound.

 - Set spacing, octave, and voice count to fit the instrument range.

 - Adjust voice leading for transitions, then add strum/dynamics for feel.





### Theory Appendix Boundary



 This manual includes enough theory reference to explain Cymasphere workflows. Deeper articles from the legacy
 knowledge base, such as solfege, intervals, circle of fifths, and harmonic analysis, belong in the 
 Theory Appendix and 
 Reference chapter once they are rewritten against the current app.

---

<!-- LayersExpressionsGuide.tsx -->
# Layers Expressions Guide

<>

## Layers & Expressions




 Cymasphere lets the same song contain different musical contexts without duplicating everything
 manually. The core ideas are layers, inherited settings, expressions, dashboard controls, and
 rotations. These concepts connect PALETTE, 
 VOICING, and 
 SONG into one performance system.




### Layer Hierarchy




 Settings follow one containment and inheritance chain — always top-down:

 **Song → Palette → Bank → Voicing button (Cymatic) → Expression**

 A song owns palettes; a palette owns banks; a bank owns twelve voicing buttons; a voicing button
 owns expression variations. The active layer determines which settings you are hearing and
 editing. Views (SONG, PALETTE, VOICING, TRACK, MIXER) are where you work on that chain — they
 are not a second hierarchy.

 Use the Layer selector for quick switching and the Layer Manager (see
 Secondary Windows Reference) for deeper navigation.

 When setting up a workspace for a style of music, create or select in that same order: song
 first (new songs include a DEFAULT palette), then palette context (key and other Song/Palette
 settings), then banks, then voicing-button scales and performance shaping, then expressions if
 needed.





 


 Layer Concept	
 What It Means	
 





 Song layer	
 Project container: arrangement, tracks, song-level settings, and Song/Palette shared settings
 such as key, voice leading, sustain, and strum.	
 


 Palette layer	
 A harmonic collection inside a song: banks, progressions, and palette settings that can inherit
 from or override the song.	
 


 Bank layer	
 One bank of twelve related voicing buttons, with bank-level voicing settings.	
 


 Voicing button layer	
 One playable harmonic cell (cymatic): scale/chord identity and per-slot voicing settings.	
 


 Expression layer	
 Alternate full setting state for variation inside a voicing button.	
 






### Linking And Overrides




 Many controls can inherit from a parent context or override it locally. Linked controls follow
 the parent and should be treated as read-only for that context. Overridden controls belong to
 the active layer/expression. If a change seems to affect the wrong scope, check the link state
 before changing the value again. See Voicing Controls In Detail for per-control behavior.





 - **Use linked settings** when many voicing buttons or banks should share one behavior.

 - **Use overrides** when one voicing button, bank, or expression needs a local variation.

 - 
 **Lock layers** during performance when accidental context switching would be disruptive.






### Expressions




 Expressions are variations of the same voicing button. Use them for alternate voicings, dynamics,
 registers, or performance gestures without creating a new bank. A performance can cycle
 expressions while keeping the same harmonic identity.





 - Create or select a voicing button in PALETTE.

 - Open it in VOICING.

 - Create an expression variation.

 - 
 Change only the controls that should differ: spacing, bass, dynamics, strum, sustain, or
 spelling (see Harmony & Voicing).


 - Return to PALETTE and perform the voicing button while cycling expressions where appropriate.





### Dashboard Controls




 The Dashboard appears in SONG, 
 TRACK, and 
 PALETTE so musical context can be edited without
 switching to VOICING. Treat it as the quick-access version of the voicing system: key, scale,
 chord, inversion, bass, voice leading, voice count, sustain, smart chord, strum, spacing, chord
 prefix, spelling, and expression.




### Palette Rotation Vs Bank Rotation




 


 Rotation	
 What Changes	
 When To Use It	
 






 Palette rotation	
 Visual degree/voicing button placement.	
 
 When you want to reorganize the performance surface without treating it as a permanent
 transposition.
 
 


 Bank rotation	
 Pitch relationship of a bank by semitone offset.	
 When a bank should keep its shape but move relative to the palette key.	
 






### Practical Use Cases




 - Use layers to keep verse and chorus voicing settings separate.

 - Use expressions to create soft, medium, and intense versions of the same voicing button.

 - Use overrides for one special bank without breaking the rest of the palette.

 - Use rotations to keep performance fingerings comfortable while harmony changes.

---

<!-- MenuActionIndex.tsx -->
# Menu Action Index

<>

## Menu And Action Index



 Use this table when you remember the command but not where it lives. Availability can depend on build mode,
 active view, selected track type, and whether Cymasphere is standalone or hosted.




### Profile Menu



 

 Action	Use It For	Notes	






 AUDIO / MIDI SETTINGS	
 Device setup, MIDI input, virtual MIDI in standalone.	
 
 Standalone/device-manager contexts. See Settings, Help & Account.
 
 


 VIRTUAL MIDI DEVICE	
 Toggle virtual MIDI where supported.	
 
 Plugin/platform dependent. See MIDI & Controller Routing.
 
 


 CONTROLLER ASSIGNMENTS	
 Map hardware controls.	
 
 Use MIDI Monitor to verify events.
 
 


 MIDI MONITOR	
 Inspect incoming/outgoing MIDI.	
 
 First stop for MIDI troubleshooting. See 
 MIDI & Controller Routing.
 
 


 CPU / RAM METER	
 Watch performance while hosting plugins or dense sessions.	
 
 Desktop utility. See Plugin Hosting & CymaSynth.
 
 


 HOTKEYS	
 Open platform shortcut reference.	
 
 Desktop only. See Reference.
 
 

USER MANUAL	Open this manual.	Desktop only.	


 GLOBAL SETTINGS	
 Open app-wide preferences.	
 
 Use carefully; affects global behavior. See Settings, Help & Account.
 
 

COLOR THEMES	Choose app appearance.	Does not change musical data.	

RESTORE	Open database recovery tools.	Use for recovery, not ordinary undo.	


 ABOUT	
 Check version/product information.	
 
 Useful when reporting issues. See About.
 
 

MANAGE ACCOUNT / LOGOUT	Manage or end account session.	Authenticated builds.	






### Song And Progression Menus



 

 Menu	Actions	Use It For	






 Song menu	
 NEW, OPEN, RENAME, SAVE AS, DELETE, EXPORT AS AUDIO	
 
 Song-level file/version/export work. See SONG View and 
 Notation & Export.
 
 


 Progression menu	
 NEW, GENERATE, OPEN, RENAME, SAVE AS, CLEAR, DELETE	
 
 Create, generate, manage, or reset progressions. See 
 Generate Progression and 
 Transport & Progressions.
 
 


 Progression block menu	
 Copy, paste, insert, replace, delete, display format	
 Edit individual chord blocks.	
 


 Timeline blank menu	
 Paste, add region/block where supported	
 Place material at a time location.	
 






### Track Menus



 

 Action	Track Types	Use It For	






 NEW / OPEN	
 
 
 
 
 Create or switch active track. Aux is mixer-focused.
 
 


 RENAME / DUPLICATE / DELETE	
 Most visible track types	
 Manage track identity and structure.	
 


 DYNAMICS	
 
 
 
 Open track-level dynamics controls.	
 


 VOICE/CHANNEL MATRIX	
 
 
 
 
 Route generated voices to MIDI channels. See 
 MIDI & Controller Routing.
 
 


 OPEN SEQUENCER	
 
 Sequencer
 
 Open detailed sequencer rule editor.	
 


 MIDI OUT	
 
 Groove
 
 Choose single groove MIDI channel.	
 


 SAVE AS GROOVE PRESET	
 
 Groove
 
 Reuse groove patterns.	
 


 COPY AS MIDI	
 
 
 
 Move notes to another app.	
 


 EXPORT AS AUDIO	
 
 
 
 
 Render a track/stem through sound path. See Notation & Export.
 
 


 NOTATION VIEW	
 
 
 
 
 Render score notation. See Notation & Export.
 
 


 CLEAR PATTERN	
 
 Pattern
 
 Remove all editable pattern notes.	
 






### Palette Menus



 

 Menu	Actions	Use It For	






 Palette selector	
 NEW, OPEN, RENAME, SAVE AS, SHOW ROTATION BUTTONS, DELETE	
 
 Manage palette collections. See PALETTE View.
 
 


 Bank menu	
 Edit settings, add/rename/reorder/delete where available	
 
 Manage banks and jump into VOICING context.
 
 


 Voicing button menu	
 NEW/EDIT VOICING, COPY, PASTE, CLEAR	
 Manage one voicing slot.	
 


 Empty bank area	
 ADD BANK	
 Add a new bank to the palette.	
 






### Mixer Menus And Slot Actions



 

 Location	Actions	Use It For	






 Strip name / right-click	
 Rename, duplicate, delete, export where supported	
 
 Manage mixer tracks. See MIXER View.
 
 


 Instrument slot	
 Open, bypass, replace, copy, paste, remove	
 
 Choose the sound source. See Plugin Hosting & CymaSynth.
 
 


 MIDI FX slot	
 Open, bypass, replace, copy, paste, remove	
 Transform MIDI before instrument.	
 


 Audio FX slot	
 Open, bypass, replace, copy, paste, remove	
 Process audio after instrument/source.	
 


 Aux send target	
 None, existing aux, new aux	
 Route audio to shared processing.	
 


 Master strip	
 Output routing, mono/stereo, master FX, fader	
 Control final standalone output.

---

<!-- MidiControllerRoutingGuide.tsx -->
# Midi Controller Routing Guide

/**
 * @fileoverview MIDI, controller assignment, matrix, and DAW routing guide.
 * @module sections/MidiControllerRoutingGuide
 */
import { memo } from 'react';
import { ManualLink } from '../components/ManualLink';
import { platformRoutingReferences, trackTypeReferences } from '../data/reference';
import { RelatedLinks } from './RelatedLinks';

/**
 * @brief Documents MIDI input/output, controller assignment, voice/channel routing, virtual MIDI, and DAW handoff.
 * @returns JSX content for the MIDI, Controller, and Routing section.
 */
export const MidiControllerRoutingGuide = memo(function MidiControllerRoutingGuide() {
 const patternTrack = trackTypeReferences.find((t) => t.type === 'Pattern');
 const voicingTrack = trackTypeReferences.find((t) => t.type === 'Voicing');
 const sequencerTrack = trackTypeReferences.find((t) => t.type === 'Sequencer');
 const grooveTrack = trackTypeReferences.find((t) => t.type === 'Groove');

 return (
 <>

## MIDI, Controller Assignments, And Routing



 Cymasphere is both a composition environment and a MIDI generator. MIDI can come from your controller, be
 generated by tracks, feed hosted instruments in standalone, route through virtual MIDI, or leave the plugin as
 DAW-track MIDI. Use Sound & Routing for audio paths and 
 Export, Stems, MIDI & Notation for handoff formats.




### MIDI Flow

 
 
 Input
 
 
 Voicing Button
 
 
 Track
 
 
 Matrix
 
 
 Destination
 
 


 - **Input:** MIDI controller, on-screen keyboard, host MIDI, or generated chart playback.

 - **Voicing Button:** PALETTE / VOICING context decides the musical meaning of performed harmony.

 - **Track:** Pattern, Voicing, Sequencer, Groove, or Aux determines playback behavior.

 - **Matrix:** Pattern, Voicing, and Sequencer can route voices to channels.

 - **Destination:** Hosted instrument, virtual MIDI port, DAW route, hardware, or notation/export path.





### Voice / Channel Matrix



 The Voice / Channel Matrix routes generated voices to MIDI channels. Use it when one track needs to drive
 multiple instruments, split bass from upper voices, or send different generated voices to different channels.
 Open it from TRACK View or track menus (see 
 Menu & Action Index).




 


 Track Type	
 Matrix Behavior	
 






 
 {patternTrack && Pattern}
 
 
 Uses the matrix for pattern playback and MIDI THRU/record monitoring, normally through one voice lane (see 
 Pattern Editor).
 
 


 
 {voicingTrack && Voicing}
 
 Routes bass and upper generated voices independently.	
 


 
 {sequencerTrack && Sequencer}
 
 Routes generated sequencer bass/voice notes according to sequencer voice indices.	
 


 
 {grooveTrack && Groove}
 
 
 Does not use the matrix; all lanes use the selected groove MIDI output channel (see 
 Groove Tracks).
 
 


 Aux	
 
 No MIDI routing; audio-only bus (see MIXER View).
 
 






### Controller Assignments



 Open **Profile menu -> CONTROLLER ASSIGNMENTS** to map hardware controls to Cymasphere actions.
 Use Learn mode when available: choose the assignment, move the hardware control, then verify the mapping in 
 MIDI Monitor. Controller assignments are for performance control, not for editing notes after the fact.




 - Map bank-degree triggers for hands-on harmonic performance in PALETTE.

 - Map transpose or transport-oriented controls when integrating with external hardware (see Transport & Progressions).

 - Use clear/reset actions when a controller sends the wrong note or CC.

 - Use MIDI Monitor to confirm the incoming event before assuming the assignment failed.

 - 
 Track Automation (eye toggle + parameter dropdown under Instrument, or in the Groove header bar) is separate: it stores pitch bend /
 CC / aftertouch over time on a track and plays them to that track's instrument and MIDI outs.
 Controller Assignments map hardware to Cymasphere UI/transport actions.






### MIDI Monitor



 MIDI Monitor is the diagnostic window for routing. Use it to see whether Cymasphere receives your controller,
 whether transport CCs are being sent, and whether virtual MIDI or host routing is active. See 
 Troubleshooting Guide when events do not appear.




 


 If You Are Debugging...	
 Look For...	
 






 No controller response	
 Incoming note/CC events when you play or move the controller.	
 


 DAW transport mapping	
 CC 102-109 or your customized transport CC numbers.	
 


 Virtual MIDI routing	
 Events leaving Cymasphere and arriving in the receiving app.	
 


 Matrix/channel splits	
 Expected note events on the intended MIDI channels.	
 






### Virtual MIDI And Platform Routing



 


 Platform / Build	
 Setup	
 Note	
 




 {platformRoutingReferences.map((item) => (


 
 {item.sectionId ? (
 {item.platform}
 ) : (
 item.platform
 )}
 
 {item.setup}	
 {item.note}	
 
 ))}






### DAW Handoff Choices



 


 Goal	
 Best Path	
 Why	
 






 Keep editing notes in the DAW	
 
 Copy as MIDI or host MIDI routing
 
 Preserves note data and lets the DAW own the instrument.	
 


 Capture Cymasphere's hosted sounds	
 
 Audio Export
 
 Includes instruments, effects, faders, and aux routing.	
 


 Play another app live from standalone	
 Virtual MIDI	
 Turns Cymasphere into a system MIDI source.	
 


 Split voices across instruments	
 Voice / Channel Matrix plus DAW or hosted routing	
 Lets bass, inner voices, and top lines drive different channels.

---

<!-- MixerViewGuide.tsx -->
# Mixer View Guide

<>

## MIXER View




 MIXER is the standalone mixing and routing console. It is not shown in hosted plugin builds because your DAW
 already owns the mixer, audio device, and final routing. See 
 Sound & Routing and 
 Plugin Hosting & CymaSynth for the full signal path.




### Strip Anatomy




 


 Strip Area	
 What It Controls	
 






 Track name	
 Rename, right-click actions, and strip identity.	
 


 Track controls	
 
 Dynamics, Sequencer, and Matrix buttons where the track type
 supports them.
 
 


 MIDI FX slots	
 Pre-instrument MIDI processing for MIDI-generating tracks.	
 


 Instrument slot	
 
 CymaSynth or another hosted instrument that receives
 Cymasphere MIDI.
 
 


 Audio FX slots	
 Insert processing after the instrument or audio source.	
 


 Aux sends	
 Parallel routing to Aux tracks for shared effects and submixes.	
 


 Pan, meter, fader, mute, solo	
 
 Final channel balance and monitoring. Right-click (or long-press) the solo button for 
 **Solo Safe**.
 
 






### Mute And Solo



 - 
 **Mute (M):** Silences the track in the mix. Soloing a muted track still lets it play (solo
 overrides mute for that track).


 - 
 **Solo (S):** Exclusive solo — only one track can be soloed at a time. Other tracks are soft-muted
 unless they are Solo Safe.


 - 
 **Solo Safe:** Right-click the **S** button and toggle Solo Safe. A solo-safe track
 stays audible when another track is soloed. The solo button shows a darker blue disabled look while Solo Safe
 is on (left-click solo is blocked; use the menu to turn Solo Safe off). Aux tracks default to Solo Safe on;
 regular tracks default off. The master strip is always solo-safe (no right-click option) so track solo never
 mutes the master bus.






### Plugin Workflow




 - Open MIXER in the standalone app.

 - Click an instrument or FX slot selector.

 - Run Scan for Plugins if the plugin browser is empty or stale.

 - Choose CymaSynth or a third-party plugin.

 - Use the slot menu to open, bypass, copy, paste, replace, or remove the plugin.





### Aux Routing




 Aux tracks are audio-only buses. Create one from the mixer, then route sends from musical tracks into the aux.
 Use this for shared reverbs, delays, parallel processing, or grouped effects. Cymasphere prevents self-routes and
 feedback loops between aux buses.




### Master Strip




 The master strip controls final standalone output. Use it for stereo metering, master fader moves, output-device
 routing, mono/stereo output selection, and master effects. The master strip does not host instruments. Master is
 always solo-safe (no Solo Safe menu); track solo does not mute the master bus.




### Track-Type Differences In MIXER




 - 
 Pattern, 
 Voicing, and 
 Sequencer tracks can use instruments, MIDI FX, audio FX, matrix
 routing, and sends.


 - 
 Groove tracks use a single MIDI output channel and do not use the Voice /
 Channel Matrix.


 - 
 Aux tracks use audio FX, sends, pan, fader, mute, and solo, but no
 instrument or MIDI FX path. Aux tracks default to Solo Safe so shared effects keep ringing when you solo a
 musical track.


 - Muted tracks show muted meter behavior so you can distinguish silence from no signal.





### In-App Help In MIXER



 Turn on help mode with the top-bar **?** button, then hover any mixer control. The labels column,
 each track strip, the master strip, PRE/POST metering, + AUX, slot-row +/- buttons, and scrollbars all expose
 contextual Simple and Technical help. Hover blank space between strips for a mixer overview. See 
 Settings, Help & Account for help-mode details.




 - **Labels column:** Explains each strip row (TRACK, MIDI FX, AUDIO FX, INSTRUMENT, SENDS, OUTPUT, PAN, METERS, VOLUME, MUTE/SOLO) and global slot +/- controls.

 - **Track strip:** Name, Dynamics/Sequencer/Matrix, plugin slots, sends, output routing, mono/stereo, pan, meters, fader, mute, and solo.

 - **Master strip:** Final output level, master FX, routing, and metering.

 - **Global controls:** PRE/POST metering toggle, + AUX track creation, horizontal and vertical scroll.

---

<!-- NotationExport.tsx -->
# Notation Export

<>

## Notation And Export



 Cymasphere can turn MIDI-generating work into notation and rendered audio. Notation is best for communicating
 musical structure; audio export is best for sharing or importing the resulting sound. See 
 Export, Stems, MIDI & Notation for the full export
 workflow.




### Notation



 The Notation window renders selected track material through LilyPond. On Mac standalone builds, LilyPond is
 bundled inside the app so notation can work without a separate user installation.




 - 
 Choose a track with calculated or recorded notes from 
 Pattern, 
 Voicing, or 
 Sequencer tracks.


 - Open the Notation window from the track menu.

 - Set staff, key signature, bars-per-system, zoom, and display options as needed.

 - If notation is empty, check that the selected track has renderable note content.





### Audio Export



 Audio bounce runs as a background export job and reports progress through the same status panel pattern used for
 longer operations. Use full mix export for a finished reference and stem export when you want to continue mixing
 elsewhere. The signal path runs through MIXER and hosted instruments
 in standalone builds.




### DAW Handoff



 If your goal is production inside another app, choose between MIDI and audio early. 
 MIDI routing keeps the notes editable in the DAW; audio
 export captures Cymasphere's hosted instruments, effects, and mixer balance. See 
 Sound & Routing for platform-specific paths.

---

<!-- PaletteViewGuide.tsx -->
# Palette View Guide

<>

## PALETTE View




 PALETTE is the harmonic-material workspace. It organizes palettes into banks and voicing buttons, then
 lets you play, copy, paste, rotate, and edit voicings in a performance-oriented layout. Pair it with 
 VOICING for note-generation rules and 
 Layers & Expressions for alternate performance setups.




### Hierarchy




 Containment inside PALETTE sits under Song in the full settings chain
 (Song → Palette → Bank → Voicing button → Expression):


 


 Level	
 Meaning	
 Typical Actions	
 






 Palette	
 A collection of related banks (owned by the active song).	
 New, open, rename, save as, show/hide rotation buttons, delete (see Menu & Action Index).	
 


 Bank	
 A row or group of twelve related voicing buttons.	
 Add, rename, reorder, edit settings, rotate, delete.	
 


 Voicing Button	
 One playable harmonic cell or voicing slot (cymatic).	
 
 Play, edit in VOICING, copy/paste voicing, clear voicing.
 
 


 Expression	
 An alternate full configuration for a voicing button.	
 
 Create variations and cycle them during performance (see 
 Layers & Expressions).
 
 






### Palette Selector Menu




 The palette selector is where you create or switch harmonic collections. Use NEW for a fresh
 palette, OPEN to switch, RENAME for organization, SAVE AS for a copy, SHOW ROTATION BUTTONS for
 visual bank controls, and DELETE when a palette is no longer needed.




### Bank And Voicing Button Menus




 - 
 **Bank EDIT SETTINGS:** Switches to VOICING and makes that bank context active.


 - 
 **Voicing Button NEW / EDIT VOICING:** Opens the active voicing button in VOICING for detailed shaping (see 
 Voicing Controls In Detail).


 - 
 **Voicing Button COPY / PASTE VOICING:** Reuses a voicing across voicing buttons without rebuilding it.


 - **Voicing Button CLEAR VOICING:** Removes the assigned voicing from that slot.

 - **Right-click below banks:** Adds a bank when the palette context supports it.





### Default Bank Templates


 When you **Spawn Bank** in PALETTE (or add a bank from a template), Cymasphere offers built-in **default bank templates**. Each template defines **twelve voicing-button slots** aligned to fixed scale degrees.


 **How the twelve slots work**

 - Every bank uses the same degree layout. Slot root pitch = palette key + semitone offset for that degree.

 - **I** (0 semitones), **#I / bII** (1), **II** (2), **#II / bIII** (3), **III** (4), **IV** (5), **#IV / bV** (6), **V** (7), **#V / bVI** (8), **VI** (9), **#VI / bVII** (10), **VII** (11).

 - A slot with **no scale** (blank) is an empty voicing button until you assign one.

 - Performance hotkeys for the active bank: **A, W, S, E, D, F, T, G, Y, H, U, J** (one key per slot).


 **Template types**

 - **Family** — modes of a parent scale (major, harmonic minor, melodic minor, harmonic major).

 - **Functional** — chords with a specific harmonic job (secondary dominants, tritone subs, passing/auxiliary diminished).

 - **Composite** — curated multi-scale collections for a key area (e.g. composite minor, sec/sub dominant pairs).

 - **Custom** — blank starting point.


 **All default bank names (12 templates)**


 | Bank name | Type | Purpose |
 |-----------|------|---------|
 | EMPTY | Custom | Twelve blank slots; build your own bank from scratch. |
 | MODES OF MAJOR | Family | Seven modes of the major scale on diatonic degrees. |
 | COMPOSITE MINOR | Composite | Curated minor-key scales across twelve degrees. |
 | DIMINISHED | Composite | Symmetrical diminished on every slot. |
 | PASSING DIMINISHED | Functional | Passing dim7 connectors between diatonic chords (chromatic voice leading). |
 | AUXILIARY DIMINISHED | Functional | Neighbor dim7 chords that embellish and return to the same harmony. |
 | SEC/SUB DOMINANT | Composite | Alternating secondary dominants and tritone substitutes (teaches their relationship). |
 | SECONDARY DOMINANT | Functional | V7/x dominants on the most common target degrees. |
 | SUBSTITUTE DOMINANT | Functional | Tritone-substitute dominants (Lydian b7) on flat degrees. |
 | HARMONIC MINOR | Family | Modes of harmonic minor. |
 | MELODIC MINOR | Family | Modes of melodic minor (jazz minor). |
 | HARMONIC MAJOR | Family | Modes of harmonic major. |


 **EMPTY** — all twelve slots blank.


 **MODES OF MAJOR** — seven modes on diatonic degrees; other slots blank.

 - **I** — Ionian

 - **II** — Dorian

 - **III** — Phrygian

 - **IV** — Lydian

 - **V** — Mixolydian

 - **VI** — Aeolian

 - **VII** — Locrian


 **COMPOSITE MINOR** — minor-key collection; blank slots at #I/bII, #II/bIII, #IV/bV, #V/bVI.

 - **I** — Aeolian

 - **II** — Locrian

 - **bIII** — Ionian

 - **IV** — Dorian

 - **V** — Mixolydian ♭9♭13

 - **bVI** — Lydian

 - **VI** — Locrian ♮9

 - **bVII** — Mixolydian

 - **VII** — Locrian ♭♭7♭4


 **DIMINISHED** — Sym. Diminished on all twelve slots (auxiliary and passing diminished vocabulary in one bank).


 **PASSING DIMINISHED** — Sym. Diminished only on chromatic passing degrees; all other slots blank.

 - **#I / bII** — passing I to II

 - **#II / bIII** — passing II to III

 - **#IV / bV** — passing IV to V (most common passing diminished)

 - **#V / bVI** — passing V to VI

 - **#VI / bVII** — passing VI to VII or chromatically back to I


 **AUXILIARY DIMINISHED** — Sym. Diminished on tonic-function degrees; chromatic-degree slots blank.

 - **I, II, III, IV, V, VI, VII** — auxiliary diminished (neighbor tension returning to the same harmony)


 **SEC/SUB DOMINANT** — alternating Mixolydian-family secondary dominants and Lydian ♭7 tritone subs on every slot.

 - **I** — Mixolydian (V7/IV)

 - **bII** — Lydian ♭7 (subV7)

 - **II** — Mixolydian (V7/V)

 - **bIII** — Lydian ♭7 (subV7/II)

 - **III** — Mixolydian ♭9♭13 (V7/VI)

 - **IV** — Lydian ♭7 (subV7/IV)

 - **bV** — Lydian ♭7 (subV7/IV, enharmonic with #IV)

 - **V** — Mixolydian (primary V7)

 - **bVI** — Lydian ♭7 (subV7/V)

 - **VI** — Mixolydian ♭13 (V7/II)

 - **bVII** — Lydian ♭7 (subV7/VI)

 - **VII** — Mixolydian ♭9♭13 (V7/III)


 **SECONDARY DOMINANT** — dominant scales only where a secondary V7 is typical; other slots blank.

 - **I** — Mixolydian (V7/IV)

 - **II** — Mixolydian (V7/V)

 - **III** — Mixolydian ♭9♭13 (V7/VI)

 - **VI** — Mixolydian ♭13 (V7/II)

 - **VII** — Mixolydian ♭9♭13 (V7/III)


 **SUBSTITUTE DOMINANT** — Lydian ♭7 tritone subs on flat degrees; other slots blank.

 - **bII** — Lydian ♭7 (subV7)

 - **bIII** — Lydian ♭7 (subV7/II)

 - **bV** — Lydian b7 (subV7/IV)

 - **bVI** — Lydian ♭7 (subV7/V)

 - **bVII** — Lydian ♭7 (subV7/VI)


 **HARMONIC MINOR** — modes of harmonic minor; blank at #I/bII, #II/bIII, #IV/bV, #V/bVI, #VI/bVII.

 - **I** — Harmonic Minor

 - **II** — Locrian ♮6

 - **bIII** — Ionian ♯5

 - **IV** — Dorian ♯4

 - **V** — Mixolydian ♭9♭13 (Phrygian dominant / V7 in minor)

 - **bVI** — Lydian ♯2

 - **VII** — Locrian ♭♭7♭4


 **MELODIC MINOR** — modes of melodic minor; blank at #I/bII, #II/bIII, #IV/bV, #V/bVI, #VI/bVII.

 - **I** — Melodic Minor

 - **II** — Dorian ♭2

 - **bIII** — Lydian ♯5

 - **IV** — Lydian ♭7 (Lydian dominant)

 - **V** — Mixolydian ♭13

 - **VI** — Locrian ♮9

 - **VII** — Altered


 **HARMONIC MAJOR** — modes of harmonic major; blank at #I/bII, #II/bIII, #IV/bV, #V/bVI, #VI/bVII.

 - **I** — Harmonic Major

 - **II** — Dorian ♭5

 - **III** — Phrygian ♭4

 - **IV** — Lydian ♭3

 - **V** — Mixolydian ♭9

 - **bVI** — Lydian ♯5♯2

 - **VII** — Locrian ♭♭7


 **Generate Progression note:** EMPTY is omitted from the Default Banks list in Generate Progression. Bank weights in generation presets refer to these template names when biasing harmonic material.





### Rotation Concepts


 
 

### Palette Rotation



 A visual/performance rotation of degree columns. Use it to reorganize how degrees appear
 without treating it as a permanent pitch edit. See 
 Layers & Expressions.


 
 

### Bank Rotation



 A bank-level semitone offset that changes the pitch relationship of that bank. Roman numerals
 and colors follow the shifted context.


 
 


### Performance Workflow




 - Choose a palette that matches the song section or harmonic vocabulary.

 - Use Z/X to move between banks.

 - Use A, W, S, E, D, F, T, G, Y, H, U, J for active-bank degree performance.

 - 
 Use the Dashboard to change key, scale, chord, expression, spelling, and voicing context (see 
 Harmony & Voicing).


 - 
 Drag or add voicings to the progression/timeline when you want to turn performance into
 arrangement (see Transport & Progressions and 
 SONG View).

---

<!-- PatternEditorGuide.tsx -->
# Pattern Editor Guide

<>

## Pattern Editor




 Pattern tracks are the most direct MIDI editor in Cymasphere. Use them when you need exact
 notes, recorded performances, or manually edited parts that should remain fixed in the song.
 Open the editor from TRACK View when a Pattern track is
 active. See Track Types In Detail for how Pattern
 compares to generated track types.




### Left Panel Controls




 


 Control	
 What It Does	
 






 Select / Add / Delete	
 Choose the active piano-roll tool. Hotkeys are 1, 2, and 3.	
 


 Temporary Delete	
 Hold Cmd on Mac or Ctrl on Windows for delete behavior while another tool is active.	
 


 AI / Generate	
 
 Opens Creation Tools for creating a pattern draft from musical context.
 
 


 Function	
 Switches between absolute and relative note behavior.	
 


 Note Type	
 Chooses MIDI, Scale, Chord, or Voice interpretation for notes.	
 


 Offset	
 Applies micro-timing without moving the note to another grid position.	
 


 Velocity	
 Sets selected note strength from soft to hard.	
 


 MIDI Output	
 
 Opens Voice / Channel Matrix routing for pattern playback (see 
 MIDI & Controller Routing).
 
 


 Dynamics	
 Opens track-level velocity variation and swell controls.	
 


 Instrument	
 
 Opens the hosted instrument for this track (see 
 Plugin Hosting & CymaSynth).
 
 


 Automation	
 
 Under Instrument: tiny eye toggle shows/hides the lane; dropdown beside it chooses Pitch Bend,
 Aftertouch, or any CC. Playback goes to
 the instrument and MIDI outs
 (see TRACK View).
 
 






### Note Types




 - **MIDI:** Fixed pitch. Use when the note should not follow harmony.

 - 
 **Scale:** Relative to the active scale. Use for melodic ideas that should transpose musically (see 
 Harmony & Voicing).


 - **Chord:** Relative to chord tones. Use for arpeggios and harmony-following figures.

 - 
 **Voice:** Relative to generated voices. Use when the pattern should follow 
 VOICING output.






### Recording Into Pattern Tracks




 - Make the Pattern track the active track in SONG View.

 - Switch to TRACK View.

 - Enable Record and start playback from the Songbar (see Transport & Progressions).

 - Incoming notes become editable piano-roll notes on this Pattern track only.

 - Incoming pitch bend, CC, and aftertouch record into the Automation lane (also available on Voicing, Sequencer, and Groove).

 - Use MIDI THRU if you need to hear controller input while recording.

 - Turn SNAP TO GRID on for quantized note recording or off for raw timing.





### Editing Workflow




 - Click or drag to create notes with the Add tool.

 - Use Select to move, resize, multi-select, copy, and paste notes.

 - Use Delete or temporary delete for cleanup.

 - 
 Right-click notes for delete, copy, paste, relative/absolute conversion, and related note
 operations.


 - Use CLEAR PATTERN from the TRACK menu when the whole part should be reset (see Menu & Action Index).





### Export And Handoff




 Pattern tracks support Copy as MIDI, Audio Export, and Notation View. Use Copy as MIDI when you
 want to continue editing note data in a DAW. Use Audio Export when the hosted
 instrument/effects are part of the sound. See 
 Export, Stems, MIDI & Notation and 
 Plugin Hosting & CymaSynth for instrument routing.

---

<!-- PluginHostingGuide.tsx -->
# Plugin Hosting Guide

<>

## Plugin Hosting And CymaSynth



 In standalone mode, Cymasphere can host instruments and effects so generated MIDI immediately becomes sound
 through the MIXER. In plugin mode, the DAW is the host; Cymasphere
 focuses on generating and routing MIDI (see Sound & Routing).




### Where Plugin Hosting Lives



 - **MIXER:** Primary standalone surface for instrument slots, audio FX slots, MIDI FX slots, and aux routing (MIXER View).

 - **TRACK:** Track editors expose instrument, dynamics, MIDI output, and type-specific controls (TRACK View).

 - **SONG:** Track menus expose export, notation, matrix, sequencer, and dynamics actions where supported (SONG View).





### Scanning For Plugins



 - Open MIXER in standalone mode.

 - Click an instrument or effect selector.

 - Run **Scan for Plugins** if the browser is empty, stale, or missing a newly installed plugin.

 - Wait for scanning to finish before loading the plugin.

 - If Cymasphere reports a crash or blacklist event, restart and scan again.





### Slot Actions



 


 Action	
 Meaning	
 






 Open	
 Shows the plugin editor window.	
 


 Bypass / Power	
 Disables the plugin without removing it or losing settings.	
 


 Replace	
 Loads a different plugin into an occupied slot.	
 


 Copy / Paste	
 Reuses slot configuration where supported.	
 


 Remove	
 Deletes the plugin from the slot.	
 






### CymaSynth Integration



 CymaSynth is included with Cymasphere and is the recommended first instrument. Cymasphere scans for it so new 
 Pattern, 
 Voicing, and 
 Sequencer tracks can start with a usable sound. Open the CymaSynth editor when you need
 sound design.



### CymaSynth Factory Preset Categories



 Factory presets use a category prefix in the filename (e.g. pad-012, bass-003). Categories include:
 8bit, bass, bell, brass, drums, elemental, exp, init, keys, layered, lead, pad, pluck, strings,
 synth, texture, and vocal.

 Ask Cyma / workspace guidance by track type:

 - **Voicing tracks:** prefer pad, keys, strings, brass, or layered for harmonic accompaniment.
 - **Sequencer tracks:** prefer pluck, lead, bass, or synth for arpeggiated / rhythmic note lines.
 - **Pattern tracks:** prefer keys, lead, drums, or synth for played/edited note parts.
 - **Groove tracks:** often rhythmic; drums or leave without a melodic instrument when appropriate.
 - **Aux tracks:** texture or FX-oriented returns; usually not a primary CymaSynth lead.

 New Pattern, Voicing, and Sequencer tracks can auto-assign CymaSynth as the instrument. Load a
 factory preset from the CymaSynth preset browser (or Ask Cyma recommend/apply tools). Do not expect
 Ask Cyma to edit CymaSynth oscillators, filters, or the mod matrix — open the CymaSynth editor for
 deep sound design.



 
 **Manual boundary:** This manual explains how Cymasphere hosts and routes CymaSynth. The CymaSynth
 User Manual explains oscillators, filters, envelopes, LFOs, modulation, effects, presets, and synth-specific
 performance controls.
 


### Crash Recovery And Blacklist



 Some third-party plugins can crash during scan or load. Cymasphere protects the session by avoiding problematic
 plugins after a crash and letting future scans continue. If a plugin is blacklisted, only remove it from the
 blacklist if you trust the plugin and understand why it crashed. See the 
 Troubleshooting Guide for scan/load symptoms.




 - Restart Cymasphere after a scan crash.

 - Scan again so Cymasphere can continue past the problematic plugin.

 - Update or reinstall the plugin before retrying if the same plugin repeatedly fails.





### Recursive Hosting Protection



 Cymasphere avoids loading itself as a hosted plugin. This prevents recursive plugin chains such as Cymasphere
 inside Cymasphere inside Cymasphere, which would be unstable and musically confusing.




### Choosing Instrument, MIDI FX, Audio FX, Or Aux



 


 Slot Type	
 Use It For	
 






 Instrument	
 
 Turning Cymasphere-generated MIDI into sound (see 
 MIDI & Controller Routing).
 
 


 MIDI FX	
 Transforming MIDI before it reaches the instrument.	
 


 Audio FX	
 Processing the sound after the instrument.	
 


 Aux send	
 Routing audio in parallel to shared effects or submixes.	
 


 Master FX	
 Processing the final standalone output.

---

<!-- Reference.tsx -->
# Reference

<>

## Reference



 Use this chapter as a lookup after you understand the main workflow. It collects keyboard shortcuts,
 troubleshooting, and vocabulary that appears throughout Cymasphere. For deeper diagnosis, see the 
 Troubleshooting Guide.




 ↑ Back to contents




### Keyboard Shortcuts



 


 Category	
 Action	
 Mac	
 Windows	
 




 {shortcutReferences.map((shortcut) => {
 const sectionId = shortcutCategorySections[shortcut.category];
 return (


 
 {sectionId ? (
 {shortcut.category}
 ) : (
 shortcut.category
 )}
 
 {shortcut.action}	
 {shortcut.mac}	
 {shortcut.windows}	
 
 );
 })}






### Troubleshooting



 


 Symptom	
 Likely Cause	
 First Step	
 




 {troubleshootingReferences.map((item) => (


 {item.symptom}	
 {item.cause}	
 


 
 
 ))}






### Export to PDF



 Open the manual from the profile menu (**USER MANUAL**). Click **Print / Save PDF** at
 the top, or press **⌘P** (Mac) / **Ctrl+P** (Windows). In the print dialog, choose 
 **Save as PDF** and enable **Background graphics** if you want section styling.




### Glossary



 


 Term	
 Meaning	
 




 {glossaryReferences.map((item) => (


 
 {item.sectionId ? (
 {item.term}
 ) : (
 item.term
 )}
 
 
 {item.definition}
 {item.sectionId && (
 <>
 
 See .
 
 )}
 
 
 ))}

---

<!-- SecondaryWindowsGuide.tsx -->
# Secondary Windows Guide

<>

## Secondary Windows Reference



 Cymasphere keeps focused tasks in secondary windows. These windows are not side quests; they are where detailed
 editing, routing, generation, setup, and diagnostics happen. Many are also listed in 
 Creation Tools.




### Layer Manager



 Layer Manager is the spreadsheet-style editor for hierarchical settings. Use it when you need to see many
 palettes, banks, voicing buttons, expressions, and inherited values at once. See 
 Layers & Expressions and 
 VOICING View.




 


 Layer Manager Area	
 Use It For	
 






 Selection column	
 Choose the row/context you are editing.	
 


 Musical columns	
 Scale, key, chord, octave, inversion, spacing, voice lead, voice count, smart chord, bass, sustain, strum, spelling, and prefix.	
 


 Cell context menu	
 EDIT, LINK/UNLINK, or open HIERARCHY for that setting.	
 


 Header actions	
 Link a column, link all columns, collapse/expand, show empty voicings, show local values, or add palette/bank contexts.	
 






### Cell Edit And Layer Hierarchy Popups



 - **Cell Edit:** Edits one value in the current layer context without navigating away.

 - **Layer Hierarchy:** Shows values through the layer chain so you can see what is inherited and what is overridden.

 - **Link toggles:** Use link/unlink to decide whether a value follows its parent or becomes local.





### Chord / Scale Window



 The Chord / Scale window is the harmonic picker behind key, scale, and chord controls. Use it when you need to
 browse scale families, filter harmonic options, audition a chord/scale relationship, or choose a more deliberate
 chord quality than simple cycling provides. See Harmony & Voicing.




 - Browse scale families such as major, minor variants, symmetrical scales, and other collections.

 - Filter by interval content or scale size when searching for a specific harmonic color.

 - 
 Toggle the preview between **staff** (native mini notation) and **clock** (12-semitone
 harmony clock). Staff shows pitch layout on a compact staff; clock shows pitch-class positions around a circle.
 On iOS the clock preview is the usual default; desktop can use either view.


 - 
 These mini previews are separate from the full Notation window,
 which exports via LilyPond. Mini staff/clock previews use the built-in native renderer for fast in-window
 feedback.






### Voice / Channel Matrix Window



 The Matrix window is a 16-channel by 13-voice routing grid: bass plus voices 1-12. Toggle cells to choose which
 voices appear on which MIDI channels. Use bulk row/column gestures where available when routing many voices at
 once. See MIDI & Controller Routing.




 - Route bass to a dedicated channel for a bass instrument.

 - Route upper voices to separate channels for orchestration or layered synths.

 - Use simpler one-channel routing when a single instrument should play the whole track.





### Dynamics Popup



 Dynamics appears as a VOICING box and as a track-level popup. It
 controls velocity shape: base velocity, deviation, swell depth, swell length, swell position, and whether swell
 behavior is active. Use it to make generated parts feel performed instead of flat.




### Controller Assignments



 Controller Assignments maps incoming MIDI events to Cymasphere actions. Use Learn to capture a hardware control,
 then verify the event in MIDI Monitor. Typical assignment
 groups include bank-degree triggers, transposition triggers, and transport controls.




 


 Assignment Area	
 Meaning	
 






 Enable	
 Turns the row mapping on or off.	
 


 Learn	
 Waits for a MIDI note or CC and assigns it to that row.	
 


 Clear	
 Removes the mapping for the row.	
 


 Device / type / channel / data	
 Shows the captured MIDI source and message details.	
 






### MIDI Monitor



 MIDI Monitor is the diagnostic companion to Controller Assignments and routing. Use it to confirm incoming
 controller messages, outgoing transport CCs, virtual MIDI activity, and channel routing. If MIDI Monitor does
 not see an event, assignment and routing layers cannot use it. See 
 Troubleshooting Guide for controller diagnosis.




### Plugin Selector Dialog



 The Plugin Selector is used for instruments, MIDI effects, and audio effects. Search or scan, choose a plugin,
 then load it into the current slot. If a scan is still running, Cymasphere may keep the selector alive in the
 background so the scan can complete. See Plugin Hosting & CymaSynth.




### Global Settings And Color Themes



 - 
 **Global Settings:** Use app-wide preferences such as note-off-before-note-on behavior and mixer
 track color saturation. See Settings, Help & Account.


 - **Color Themes:** Choose visual themes and preview voicing-button colors before committing. See 
 Settings, Help & Account.





### Expression, Spawn Bank, Groove Presets, And Style Detail



 - 
 **Expression Window:** Add, remove, and select expression variations for a voicing button. See 
 Layers & Expressions.


 - 
 **Spawn Bank:** Choose one of the **default bank templates** (see Default Bank Templates under PALETTE View) and insert a new bank into the current 
 PALETTE context.


 - 
 **Groove Presets:** Save and load groove lane/step patterns. See 
 Groove Tracks.


 - 
 **Style Detail:** Read style-specific notes from 
 Generate Groove before applying a rhythm style.

---

<!-- SequencerGuide.tsx -->
# Sequencer Guide

<>

## Sequencer




 Sequencer tracks generate rhythmic note patterns from sequencer rules and progression timing.
 Use them for arpeggios, repeated gestures, ordered or randomized voice patterns, and custom
 rhythmic figures. Unlike Pattern tracks, Sequencer
 output follows voicing and progression context automatically.




### Where Sequencer Editing Happens




 TRACK View shows the generated result. The Sequencer window
 (see Secondary Windows Reference) edits the rules.
 Open it from a Sequencer track menu or the SEQUENCER button where available. TRACK View also has the
 shared Automation lane (pitch bend / CC / aftertouch) under the generated roll — same controls as
 Pattern / Voicing / Groove.




### Core Sequencer Controls




 


 Control	
 Purpose	
 






 Pattern / Direction	
 Chooses ordered, reverse, up-down, shuffle, chaos, custom, or related traversal behavior.	
 


 Shuffle	
 Regenerates random order for shuffle/chaos-style patterns.	
 


 Note Value	
 Sets rhythmic subdivision from long values down to fast divisions.	
 


 Tuplet	
 Adds triplet or higher tuplet subdivisions when straight divisions do not fit the phrase.	
 


 Swing	
 Moves off-beats later for straight-to-heavy swing feels.	
 


 Deviation	
 Adds randomized timing variation in milliseconds.	
 


 Duration	
 Sets note length as a percentage of note value; very high values can behave like held notes.	
 


 Include Bass	
 Includes or excludes the bass note from generated sequencer material.	
 


 Reset / Loop	
 Controls whether the pattern restarts and whether it continues repeating.	
 


 Display Type	
 Changes note labels in the visualizer.	
 






### Preview And Playback




 - 
 **Global playback:** Sequencer tracks emit calculated MIDI along the progression timeline (see 
 Transport & Progressions).


 - 
 **Realtime preview:** User voicing button triggers from 
 PALETTE can drive sequencer notes without waiting for chart playback.


 - 
 **Ghost Track:** Chart sequencer playback is silent, but user-triggered realtime preview can remain active.


 - 
 **Pattern visualizer:** Shows rows for voices, blocks for note durations, and playhead position.






### When To Use Sequencer Instead Of Pattern




 


 Use Sequencer When...	
 Use Pattern When...	
 






 The part should follow voicing/progression changes automatically.	
 The exact notes and positions should be hand-authored.	
 


 You want shuffle, chaos, swing, tuplets, reset, or loop behavior as rules.	
 You want to record or edit each note directly.	
 


 The same pattern should adapt across harmonic contexts.	
 The part should stay fixed regardless of harmony.	
 






### Export




 Sequencer tracks support Copy as MIDI, Audio Export, and Notation View. Export uses the
 generated notes, not the abstract rule settings. Route voices through the Voice / Channel Matrix
 (see MIDI & Controller Routing) before
 handoff. Full export options are in 
 Export, Stems, MIDI & Notation.

---

<!-- SettingsHelpGuide.tsx -->
# Settings Help Guide

<>

## Settings, Help, Account, And Restore



 The profile menu is the home for app-level tools: audio/MIDI setup, virtual MIDI, controller assignments, 
 MIDI Monitor, CPU/RAM meter, hotkeys, this manual, global
 settings, themes, restore, about, account, and logout.




### Help Mode



 Use the **?** help button to toggle contextual help. With help mode on, hover supported controls to
 see a popup explanation. Help popups are useful when you need a quick reminder without leaving the current view.
 The MIXER view includes full strip-level help for faders, meters, pan,
 mute/solo, plugin slots, sends, routing, master output, PRE/POST metering, slot rows (+/-), and scrollbars.




 - **Simple help:** Plain-language explanation of the control.

 - **Technical help:** More detailed behavior and workflow notes where available.

 - 
 **Manual:** Use Profile menu -> USER MANUAL for deeper workflows and 
 Reference tables.






### Audio / MIDI Settings



 Available when Cymasphere owns the audio device manager, primarily standalone. Use it to choose audio output,
 MIDI input, sample rate, buffer size, and virtual MIDI output where supported. In plugin builds, your host owns
 audio and MIDI device configuration. See Sound & Routing and 
 MIDI & Controller Routing for workflow context.




### Global Settings



 Global Settings are app-wide preferences. Use them carefully because they can affect multiple songs or workflows.
 If a setting changes playback, routing, or visual behavior globally, document the change in the project/session
 notes so it is not mistaken for a track-specific issue later.




### Color Themes



 Color Themes change Cymasphere's appearance. They are useful for visibility, comfort, and long sessions.
 Theme changes do not change the musical content of songs, tracks, palettes, or presets.




### Hotkeys



 HOTKEYS opens the native shortcut reference. Use it for the current platform's Mac/Windows shortcut labels.
 The Reference chapter also lists the most important shortcuts for playback,
 navigation, Palette performance, and 
 Pattern editing.




### CPU / RAM Meter



 The CPU / RAM meter helps diagnose performance. Use it when 
 plugin hosting, dense arrangements, large effects chains, or low
 buffer sizes cause glitches. If meters spike only after loading a plugin, inspect that plugin before blaming
 Cymasphere's MIDI generation.




### MIDI Monitor And Controller Assignments



 MIDI Monitor shows incoming/outgoing MIDI activity.
 Controller Assignments maps hardware controls to Cymasphere actions. Use MIDI Monitor first when a controller does
 not appear to work; it tells you whether the event is arriving at all. See 
 Troubleshooting Guide for controller and routing diagnosis.




### Restore



 RESTORE opens database recovery tools. Use it when local Cymasphere data is missing, damaged, or needs recovery.
 Do not use restore as an undo button for ordinary editing; use song/palette/progression save workflows for
 normal versioning.




### Account, Manage Account, And Logout



 MANAGE ACCOUNT opens account management, subscription, or website-linked account flows. LOGOUT signs out of the
 current Cymasphere session. If a feature depends on authentication or subscription state, confirm account status
 before troubleshooting local audio or MIDI routing.




### About



 ABOUT shows version and product information. Use it when reporting issues,
 checking whether a manual applies to the installed build, or confirming release version before updating.

---

<!-- SongViewGuide.tsx -->
# Song View Guide

<>

## SONG View




 SONG is the arrangement workspace. Use it to see the track list, timeline regions, progression
 context, active layer, and the playhead in one place. It is the best view when you are deciding
 what exists in the song and where it happens. Pair it with 
 Transport & Progressions for timing and 
 TRACK for detailed editing.




### Layout




 


 Area	
 What It Shows	
 Use It For	
 






 Track list	
 Song tracks with names, types, drag handles, and per-track menus.	
 
 Selecting, reordering, renaming, duplicating, inserting, or deleting tracks (see 
 Track Types In Detail).
 
 


 Timeline / regions	
 Track regions aligned to the progression and playhead.	
 Moving, resizing, splitting, deleting, expanding, or opening regions for editing.	
 


 Playhead line	
 A vertical line synchronized to the current playback position.	
 Understanding where playback is inside the arrangement.	
 


 Layer selector	
 The active layer and lock state.	
 
 Changing song context or protecting a layer while performing (see 
 Layers & Expressions).
 
 


 Dashboard	
 Shared harmonic controls such as expression, key, scale, chord, voicing, and spelling.	
 
 Editing musical context without leaving the arrangement (see 
 VOICING and 
 Layers & Expressions).
 
 






### Track And Region Actions




 - 
 **Empty song:** Click the empty track area to create the first track and choose a track type.


 - **Blank list area:** Right-click to add a track when the song already has tracks.

 - 
 **Track menu:** Rename, edit, duplicate, insert above/below, delete, open dynamics, open matrix,
 copy MIDI, export audio, open notation, or use groove-specific MIDI/preset actions (see 
 Menu & Action Index).


 - 
 **Region menu:** Copy, paste, edit track, split, delete, or expand a region to the full progression.


 - **Timeline blank area:** Paste or add a region at the target location.





### Arrangement Workflow




 - 
 Create 
 {trackTypeReferences.map((track, index) => (
 
 {index > 0 && (index === trackTypeReferences.length - 1 ? ', and ' : ', ')}
 {track.type}
 
 ))} 
 tracks for the musical roles you need.


 - Arrange track regions against the progression timeline.

 - 
 Use EDIT TRACK to jump from a song-level strip into the detailed 
 TRACK editor.


 - 
 Use the Dashboard and Layer selector when the song section needs a different harmonic context (see 
 Layers & Expressions).


 - 
 Use COPY AS MIDI, EXPORT AS AUDIO, or NOTATION VIEW from supported track menus for handoff (see 
 Export, Stems, MIDI & Notation).






### Important Notes




 - 
 Aux tracks are MIXER routing tracks and are not part of the SONG
 arrangement list.


 - 
 New Pattern, Voicing, and Sequencer tracks can start with CymaSynth when it is available (see 
 Plugin Hosting & CymaSynth).


 - Horizontal wheel gestures over the timeline area scroll the arrangement timeline.

 - On iOS, long-press/context gestures replace desktop right-click behavior where needed.

---

<!-- SoundRouting.tsx -->
# Sound Routing

<>

## Sound And Routing



 Cymasphere can make sound through hosted instruments, send MIDI to other software, or operate inside a DAW. The
 right routing choice depends on whether Cymasphere is running standalone or as a plugin. See 
 Plugin Hosting & CymaSynth and 
 MIDI & Controller Routing for detailed setup.




### CymaSynth



 CymaSynth is included with Cymasphere and is the recommended first instrument. Cymasphere scans for it so new
 tracks can start with a known sound source. Open the CymaSynth editor from the track or 
 MIXER when you need oscillator, filter, modulation, preset, or effects
 editing.




### Plugin Scanning And Hosting



 - 
 Open MIXER in the standalone app.


 - Click a track's instrument selector.

 - Run **Scan for Plugins** if the browser is empty or stale.

 - If a plugin crashes during scan, restart Cymasphere; crash recovery can blacklist the problematic plugin.





### Mixer Signal Tasks



 - Use faders, mute/solo, and meters to balance tracks. Right-click Solo for Solo Safe (aux default on; master always safe).

 - Use instrument slots for synths or samplers that receive Cymasphere MIDI.

 - Use audio FX slots for processing the resulting sound.

 - Use aux sends and Aux tracks for shared processing such as reverbs or delays.





### Routing Recipes



 


 Workflow	
 Path	
 Note	
 




 {routingReferences.map((route) => (


 
 {route.sectionId ? (
 {route.workflow}
 ) : (
 route.workflow
 )}
 
 {route.path}	
 {route.note}	
 
 ))}

---

<!-- TheoryAppendix.tsx -->
# Theory Appendix

<>

## Theory Appendix



 Cymasphere uses music theory as an interface, not as trivia. This appendix defines the concepts you need to use
 the product: degrees, intervals, scales, chord quality, inversions, solfege, voice leading, and low interval
 limits. Apply them in VOICING and 
 PALETTE.




### Scale Degrees



 Scale degrees describe notes by their position inside a key or scale. Roman numerals such as I, II, III, IV, V,
 VI, and VII are useful because they stay meaningful when the key changes.




 


 Degree	
 Meaning In A Major Key	
 Typical Function	
 





I	Tonic	Home / resolution	

II	Supertonic	Preparation / motion	

III	Mediant	Color / relative motion	

IV	Subdominant	Preparation / expansion	

V	Dominant	Tension / return to tonic	

VI	Submediant	Relative color / deceptive motion	

VII	Leading tone	Tension / pull toward tonic	






### Intervals



 An interval is the distance between two notes. Cymasphere uses intervals in spacing, chord construction,
 inversion, voice leading, and low interval limits. When a voicing sounds muddy, the problem is often an interval
 that is too close in a low register.




### Chord Quality



 Chord quality describes the color of a chord: major, minor, diminished, augmented, seventh, suspended, extended,
 and so on. Changing quality changes which tones Cymasphere considers chord tones for voicing, 
 Sequencer, and 
 Pattern-relative behavior.




### Inversion And Bass



 Inversion changes which chord tone appears lowest in the upper voicing. Bass controls can add or choose a bass
 note separately. This distinction matters: a chord can have one inversion while the bass follows another musical
 rule. See Voicing Controls In Detail.




### Solfege



 Solfege names scale degrees with syllables such as Do, Re, Mi, Fa, Sol, La, and Ti. Use solfege display when
 relative scale function matters more than note letters.




### Voice Leading



 Voice leading is the movement of individual notes from one chord to the next. Smooth voice leading keeps each
 voice moving by small intervals when possible. Use Voice Lead controls in 
 Harmony & Voicing when chord changes sound jumpy or when
 generated parts need to feel playable.




### Low Interval Limits



 Low notes need more space than high notes. Intervals that sound clear in a high register can sound muddy in the
 bass. Low interval limits help prevent dense, low-register clashes by keeping lower voices farther apart.




### Functional Harmony



 Functional harmony describes what chords are doing: resting, preparing, creating tension, or resolving. 
 Generate Progression and manual progression editing in 
 Transport & Progressions are easier when you listen for
 function, not just chord names.




 - **Tonic:** Stable home base.

 - **Predominant:** Prepares motion toward tension.

 - **Dominant:** Creates pull toward resolution.

 - **Resolution:** Releases tension or lands in a new area.





### How Theory Connects To Cymasphere Controls



 


 Concept	
 Controls That Use It	
 






 Scale degrees	
 
 Palette banks, voicing buttons, chord blocks, display formats
 
 


 Intervals	
 
 Spacing, voice leading, low interval limits, chord quality in 
 VOICING
 
 


 Inversion	
 
 VOICING inversion, bass behavior, chord display
 
 


 Solfege	
 
 Keyboard labels, chord display, relative naming in PALETTE
 
 


 Function	
 
 Generate Progression, manual progression editing,
 harmonic analysis

---

<!-- TrackTypesGuide.tsx -->
# Track Types Guide

<>

## Track Types In Detail




 Track type determines what a track stores, how it reacts to the progression, whether it records MIDI, how it
 routes voices, and whether it supports notation, MIDI copy, or audio export. Edit tracks in 
 TRACK View; see 
 Tracks & Progressions for playback context.




### Comparison Matrix




 


 Capability	
 
 Pattern
 
 
 Voicing
 
 
 Sequencer
 
 
 Groove
 
 
 Aux
 
 






 Stores editable note data	
 Yes	
 No, generated	
 No, generated from sequencer settings	
 Groove lanes/steps	
 No MIDI data	
 


 Records incoming MIDI	
 Yes	
 No	
 No	
 No	
 No	
 


 Uses Voice / Channel Matrix	
 Yes	
 Yes	
 Yes	
 No, single MIDI channel	
 No	
 


 Copy as MIDI	
 Yes	
 Yes	
 Yes	
 No	
 No	
 


 Notation View	
 Yes	
 Yes	
 Yes	
 No	
 No	
 


 Audio export	
 Yes	
 Yes	
 Yes	
 No	
 No	
 


 Ghost Track behavior	
 Chart playback silent	
 Chart silent, user play active	
 Chart silent, user RTS preview active	
 Chart playback silent	
 Not applicable	
 






### 
 Pattern Tracks





 Pattern tracks store editable MIDI-like notes. Use them for fixed riffs, bass lines, melodies, and any part where
 the exact note placement matters. Pattern notes can be absolute MIDI pitches or relative musical values that
 adapt to the progression.





 - 
 **Editing:** Piano roll, Select/Add/Delete tools, copy/paste, clear pattern, multi-select. See 
 Pattern Editor.


 - 
 **Recording:** The only track type that records incoming MIDI notes into editable note data.
 Pitch bend / CC / aftertouch still record into the shared Automation lane (same as other track types).


 - **Timing:** SNAP TO GRID quantizes note recording; turning it off records raw note timing.

 - 
 **Automation:** Optional lane for pitch bend, CC, and aftertouch under the roll — see 
 TRACK View.


 - 
 **Routing:** Uses Voice / Channel Matrix, normally voice index 1 for pattern playback.


 - 
 **Export:** Supports Copy as MIDI, Audio Export, and Notation View. See 
 Notation & Export.






### 
 Voicing Tracks





 Voicing tracks generate notes from the progression and current voicing settings. Use them for chordal parts,
 harmonic accompaniment, and live voicing button performance where the notes should respond to key, scale,
 inversion, bass, spacing, voice leading, and expression.





 - 
 **Editing:** Change the voicing rules in VOICING 
 rather than editing output notes directly.


 - 
 **Realtime play:** User voicing button input can trigger voicings even when chart playback is silent.


 - **Routing:** Bass and upper voices route through Voice / Channel Matrix voices.

 - **Export:** Supports Copy as MIDI, Audio Export, and Notation View.

 - 
 **Automation:** Draw or record pitch bend / CC / aftertouch under the generated roll
 (see TRACK View).


 - 
 **Limitation:** The piano roll is display/preview of generated notes, not a hand-edit score.






### 
 Sequencer Tracks





 Sequencer tracks generate notes from sequencer settings and progression timing. Use them for arpeggiated,
 repeated, shuffled, swung, or custom-drawn patterns that should follow the harmonic chart.





 - 
 **Editor:** Open the Sequencer window for pattern type,
 note value, tuplets, swing, deviation, duration, include bass, reset, loop, and custom draw behavior.


 - **Realtime preview:** User voicing button triggers can drive realtime sequencer preview.

 - **Routing:** Uses Voice / Channel Matrix for bass and generated voices.

 - **Export:** Supports Copy as MIDI, Audio Export, and Notation View.

 - 
 **Automation:** Draw or record pitch bend / CC / aftertouch under the generated roll
 (see TRACK View).


 - 
 **Limitation:** TRACK view shows generated output;
 detailed rule editing lives in Sequencer window.






### 
 Groove Tracks





 Groove tracks store lanes and steps. Use them for rhythmic/percussive MIDI patterns, drum-style accompaniments,
 and generated grooves. They are not harmonic voicing tracks and do not use the Voice / Channel Matrix.





 - 
 **Grid:** Rows are lanes; columns are steps. Click to toggle steps and drag to draw patterns.


 - **Lanes:** Each lane has a MIDI note, mute state, and step pattern.

 - 
 **MIDI out:** The whole groove track uses one MIDI output channel, selectable from CH 1-16.


 - 
 **Generation:** Generate Groove uses style, elements, complexity, density, feel, swing,
 humanize, fills, phrase length, and groove length. See Groove Tracks.


 - 
 **Automation:** Same PB/CC/aftertouch lane as other tracks under the step grid.


 - 
 **Limitations:** No Copy as MIDI, no Audio Export, no Notation View, and no matrix routing.






### 
 Aux Tracks





 Aux tracks are audio routing tracks. They are mixer-first, not arrangement-first. Use them for shared effects,
 parallel processing, submixes, and routing other tracks through common audio processing.





 - 
 **Where they appear:** MIXER view, not the 
 SONG arrangement list or TRACK open list.


 - **Signal:** Receives audio from aux sends or post-fader routing.

 - 
 **Processing:** Audio FX, pan, fader, mute, solo, and sends; no instrument or MIDI FX path.


 - 
 **Routing safety:** Cymasphere prevents self-routes and feedback loops between aux buses.


 - 
 **Limitations:** No MIDI generation, no recording, no Copy as MIDI, no notation, no direct audio export.

---

<!-- TrackViewGuide.tsx -->
# Track View Guide

/**
 * @fileoverview TRACK view editing guide.
 * @module sections/TrackViewGuide
 */
import { memo } from 'react';
import { ManualLink } from '../components/ManualLink';
import { trackTypeReferences } from '../data/reference';
import { RelatedLinks } from './RelatedLinks';

/**
 * @brief Documents the TRACK view editor for pattern, voicing, sequencer, and groove tracks.
 * @returns JSX content for the TRACK View section.
 */
export const TrackViewGuide = memo(function TrackViewGuide() {
 const patternTrack = trackTypeReferences.find((t) => t.type === 'Pattern');
 const voicingTrack = trackTypeReferences.find((t) => t.type === 'Voicing');
 const sequencerTrack = trackTypeReferences.find((t) => t.type === 'Sequencer');
 const grooveTrack = trackTypeReferences.find((t) => t.type === 'Groove');

 return (
 <>

## TRACK View




 TRACK is the detailed editor for the active song track. The center of the view changes
 depending on whether the selected track is Pattern, Voicing, Sequencer, or Groove. Aux tracks
 are handled in MIXER instead. Open TRACK from 
 SONG with EDIT TRACK or by selecting a track region.




### Shared TRACK View Areas




 


 Area	
 Use It For	
 






 TRACK menu	
 
 New/open/rename/duplicate/delete tracks, copy MIDI, export audio, clear patterns, and open
 notation (see Menu & Action Index).
 
 


 Regions bar	
 Keeping the track editor aligned to song regions and progression timing.	
 


 Dashboard	
 
 Editing active harmonic context while viewing the selected track (see 
 Layers & Expressions).
 
 


 Layer selector	
 Changing or locking the active layer for track-level edits.	
 


 Automation lane	
 
 Optional pitch bend / CC / aftertouch editor under the piano roll or groove grid. Show/hide and
 parameter pickers sit under Instrument (Pattern / Voicing / Sequencer) or in the Groove header bar
 beside INSTRUMENT.
 
 






### Editor By Track Type




 


 Track Type	
 Editor	
 Primary Controls	
 






 
 {patternTrack && Pattern}
 
 Editable piano roll.	
 
 Select/Add/Delete tools, AI generate, note type, function, offset, velocity, MIDI output,
 dynamics, instrument, automation — see Pattern Editor.
 
 


 
 {voicingTrack && Voicing}
 
 Read-only generated-note roll.	
 
 Display text, MIDI output, dynamics, instrument, automation, mute/solo — see 
 VOICING View.
 
 


 
 {sequencerTrack && Sequencer}
 
 Generated sequencer-note roll plus Sequencer window access.	
 
 Display text, SEQUENCER button, MIDI output, dynamics, instrument, automation, mute/solo — see 
 Sequencer.
 
 


 
 {grooveTrack && Groove}
 
 Groove lane/step grid.	
 
 Generate, presets, MIDI out channel, lane mute/solo, dynamics, instrument, automation, track mute/solo — see 
 Groove Tracks.
 
 






### TRACK Menu Details




 - **NEW:** Creates a new track after you choose a type.

 - **OPEN:** Switches the active track. Aux tracks are intentionally excluded.

 - **RENAME / DUPLICATE / DELETE:** Manage the active track.

 - 
 **COPY AS MIDI:** Available for Pattern, Voicing, and Sequencer material (see 
 Export, Stems, MIDI & Notation).


 - 
 **EXPORT AS AUDIO:** Available for tracks that can render audio through an instrument path.


 - 
 **CLEAR PATTERN:** Pattern-only action that removes editable notes after confirmation.


 - 
 **NOTATION VIEW:** Available for Pattern, Voicing, and Sequencer tracks (see 
 Notation & Export).






### Pattern Editing Basics




 Pattern tracks are the only track type that records incoming MIDI notes into editable piano-roll
 data. Use the Select, Add, and Delete tools for editing. Notes can be absolute MIDI pitches or
 relative musical values such as scale, chord, or voice references. The Offset slider gives
 micro-timing without moving the note's grid location. See 
 Pattern Editor and 
 Transport & Progressions for recording options.




### MIDI Articulations / Automation




 Every Pattern, Voicing, Sequencer, and Groove track can show one automation lane for pitch bend,
 control change, or channel aftertouch. On Pattern / Voicing / Sequencer the eye toggle and
 parameter dropdown sit under Instrument; on Groove they live in the header bar to the right of
 INSTRUMENT (the lane still draws under the grid). Draw with Select / Pencil / Line / Erase in the
 lane gutter, or Record + Play to capture controller input into the Pitch Bend / CC / Aftertouch
 lanes. Recorded or drawn automation plays back to the track's hosted instrument and its MIDI outs.
 Targets that already have points stay pinned at the top of the target list.




### Generated Track Basics




 Voicing and Sequencer tracks display calculated notes. Edit the musical rules that create them
 rather than dragging every output note. Use VOICING for
 chord-to-note behavior and the Sequencer window for sequencer rules.

---

<!-- TracksProgressions.tsx -->
# Tracks Progressions

<>

## Tracks And Progressions



 Tracks are the bridge between the SONG chart and the notes or audio you
 hear. Progressions provide timing and harmonic context;
 track type determines whether Cymasphere stores notes, generates notes, plays a sequencer, or routes audio.




### Track Types



 


 Type	
 Role	
 Best For	
 Note	
 




 {trackTypeReferences.map((track) => (


 
 {track.type}
 
 {track.role}	
 {track.bestFor}	
 {track.note}	
 
 ))}






### Progression Playback



 During normal playback, chart-timed tracks can follow the playhead and emit calculated MIDI. 
 Voicing tracks use the progression plus your voicing settings; 
 Pattern and 
 Sequencer material follow their own stored or generated timing.




### Ghost Track Mode



 Ghost Track keeps the progression visible as a dimmed timing reference while chart-timed MIDI stays silent. Your
 real-time voicing button input still plays, which makes it useful for practice, reharmonization, and performance
 against an existing chart. See Transport & Progressions 
 for ghost-track controls.




### Recording Options



 - 
 **MIDI THRU:** Incoming MIDI plays through while you record or monitor (see 
 Pattern Editor).


 - 
 **SNAP TO GRID:** Incoming notes quantize to the grid when enabled; disabling it preserves raw
 timing (see Transport & Progressions).


 - 
 **Pattern note editing:** Use tools 1, 2, and 3 for select, add, and delete in 
 Pattern tracks.


 - 
 **Articulations:** Pitch bend / CC / aftertouch record into the Automation lane on Pattern,
 Voicing, Sequencer, and Groove (see TRACK View).

---

<!-- TransportProgressionGuide.tsx -->
# Transport Progression Guide

<>

## Transport & Progressions




 The Songbar is the timing center of Cymasphere. It controls playback, recording, count-off,
 metronome, Ghost Track, grid resolution, progression selection, and timeline navigation. If
 something happens at a musical time, the Songbar or progression timeline is usually involved.
 See SONG View for arrangement context and 
 Tracks & Progressions for how progressions
 relate to song structure.




### Transport Controls




 


 Control	
 Behavior	
 Controller / Workflow Notes	
 






 Play	
 Starts playback from the current playhead position.	
 
 Space toggles playback. Plugin transport mapping defaults to CC 105 where host integration uses
 MIDI CC (see MIDI & Controller Routing).
 
 


 Stop	
 Stops playback; in beginning/reset contexts, returns the playhead to the start.	
 Default stop CC is 104; return-to-beginning uses CC 107.	
 


 Rewind / Fast Forward	
 Moves through the song timeline.	
 Defaults are CC 102 and CC 103. Hold for repeated seeking where supported.	
 


 Record	
 Captures supported MIDI input into the active Pattern track.	
 
 Right-click for MIDI THRU and SNAP TO GRID. Recording is local behavior rather than a transport
 CC.
 
 


 Metronome	
 Adds audible click timing for playback or recording.	
 Default CC is 108. Cymasphere 2.1.1 fixes click rendering across audio block boundaries.	
 


 Count Off	
 Adds a count-in before playback or recording begins.	
 Default CC is 109. Use it when you need time before the first downbeat.	
 


 Ghost Track	
 Dims the progression and mutes chart-timed MIDI while user voicing button play remains active.	
 
 Use for practicing or reharmonizing against a visible chart (see 
 PALETTE View).
 
 






### Record Button Context Menu




 - 
 **MIDI THRU:** Incoming MIDI plays through while monitoring or recording. This is useful when you want to hear the controller input immediately (see MIDI & Controller Routing).


 - 
 **SNAP TO GRID:** When on, recorded note starts/durations snap to the grid. When off, notes keep raw performance timing. Articulation (PB/CC/AT) recording is not quantized by this setting.






### What Record Captures




 - 
 **Notes:** Only the active Pattern track
 in TRACK View stores incoming notes as editable data.


 - 
 **Articulations:** Pitch bend, CC, and channel aftertouch record into the Automation lane
 on Pattern, Voicing, Sequencer, and Groove tracks while Record + Play are active in Track View.






### Grid Resolution




 Grid resolution controls the timeline subdivision used for snapping and visual reference. Use
 coarser values for broad arrangement moves in SONG View and finer values for detailed edits in 
 TRACK View. SNAP TO GRID
 decides whether recording uses the grid or preserves raw timing.




### Progression Menu




 


 Action	
 Use It For	
 






 NEW	
 Create a fresh progression for the current song/context.	
 


 GENERATE	
 
 Open Generate Progression for a source-backed harmonic draft.
 
 


 OPEN	
 Switch to another saved progression.	
 


 RENAME / SAVE AS	
 Organize or branch progression ideas.	
 


 CLEAR	
 Remove the current block content while keeping the progression container.	
 


 DELETE	
 Remove a progression you no longer need.	
 






### Progression Timeline And Chord Blocks




 The progression timeline is the visible chord chart. Each block represents a harmonic event
 over a duration. Blocks color and pulse to show musical identity and current playback position.
 Drag voicings from PALETTE to add blocks, or edit
 harmonic rules in VOICING.





 - **Select:** Click a block to inspect or act on it.

 - **Move:** Drag blocks to rearrange progression timing.

 - **Resize:** Drag the right edge to change duration.

 - **Add:** Drag voicings from PALETTE or use empty timeline/context actions.

 - 
 **Context menu:** Copy, paste, insert, replace, delete, and change display format where available.


 - 
 **Display formats:** Use numeral, letter, or solfege naming when the musical context calls for it (see 
 Harmony & Voicing).






### Ghost Track Behavior




 


 Feature	
 When Ghost Track Is On	
 






 Progression bar	
 Dimmed reference with active playhead timing.	
 


 
 Voicing / 
 Pattern / 
 Groove chart playback
 
 Muted so the chart does not play itself.	
 


 User voicing button input	
 Still audible through realtime user-trigger paths.	
 


 Progression recording	
 Disabled until Ghost Track is turned off.

---

<!-- TroubleshootingGuide.tsx -->
# Troubleshooting Guide

<>

## Troubleshooting Guide



 Troubleshooting is fastest when you isolate the layer that failed: input, track generation, routing, plugin
 hosting, audio output, export, notation, or local data. Use the 
 Control & Feature Index to jump to the relevant chapter.




### No Sound



 - Check whether Cymasphere is standalone or hosted in a DAW.

 - 
 Standalone: open AUDIO / MIDI SETTINGS and confirm the output device (see 
 Settings, Help & Account).


 - 
 Check MIXER meters, master fader, track fader, mute, solo, and instrument slot.


 - 
 Check whether Ghost Track is muting chart playback (see 
 Transport & Progressions).


 - 
 Check whether the selected track type can generate sound in the current context (see 
 Track Types In Detail).






### MIDI Controller Does Not Work



 - 
 Open MIDI Monitor.


 - Play the controller and confirm incoming note/CC events appear.

 - If no events appear, check OS/DAW MIDI input selection.

 - 
 If events appear but assignments fail, open Controller Assignments and relearn the row (see 
 MIDI & Controller Routing).


 - 
 If notes appear but no sound plays, check track routing and instrument slot (see 
 Plugin Hosting & CymaSynth).






### Plugin Scan Or Load Problems



 


 Symptom	
 Likely Cause	
 Next Step	
 






 Plugin missing from browser	
 Scan has not run or plugin is installed in an unscanned location.	
 Run Scan for Plugins from the selector.	
 


 Scan crashes	
 A third-party plugin failed during discovery.	
 Restart Cymasphere and scan again so crash recovery can skip the bad plugin.	
 


 Plugin repeatedly fails	
 Plugin is incompatible, outdated, or unstable in the host.	
 Update/reinstall the plugin or leave it blacklisted.	
 


 Cymasphere not available as hosted plugin	
 Recursive hosting protection filters it out.	
 Use Cymasphere as the host app/plugin, not as a plugin inside itself.	
 






### Recording Problems



 - 
 Only Pattern tracks record incoming MIDI notes into editable
 piano-roll data.


 - 
 The active track must be the Pattern track you want to record notes into in 
 TRACK View.


 - 
 Pitch bend / CC / aftertouch recording works on Pattern, Voicing, Sequencer, and Groove: enable Record + Play
 in Track View and use the AUTOMATION eye toggle (under Instrument, or Groove header bar) if you want to see the points.


 - 
 SNAP TO GRID affects note quantization; turn it off for raw note timing (see 
 Transport & Progressions).


 - MIDI THRU affects monitoring; turn it on if you need to hear input while recording.

 - 
 If automation reaches MIDI Monitor but not the hosted instrument, confirm the instrument is loaded and
 (for CymaSynth CCs) that a MIDI CC mapping exists for that controller.






### Export Or Notation Problems



 - 
 **Empty notation:** Use Pattern, Voicing, or Sequencer material with renderable notes (see 
 Export, Stems, MIDI & Notation).


 - 
 **Groove export missing:** Groove tracks do not currently support Copy as MIDI, Audio Export, or Notation View (see 
 Groove Tracks).


 - 
 **Aux export missing:** Aux tracks are routing buses, not direct musical exports (see 
 MIXER View).


 - **MP3 unavailable:** Use WAV/AIFF or a build with the bundled encoder.

 - **Silent stem:** Check mute/solo, instrument slot, fader, output routing, and FX bypass.





### Performance Problems



 - Use the CPU / RAM meter to confirm whether the issue is CPU, memory, or plugin load.

 - Increase buffer size if low-latency settings click or overload.

 - Stop playback before changing audio devices or buffer size.

 - 
 Bypass heavy plugins to isolate whether the problem is Cymasphere generation or hosted processing (see 
 Plugin Hosting & CymaSynth).






### Data Or Settings Problems



 - Use SAVE AS for normal song/progression/palette versioning.

 - Use RESTORE only for recovery of local data problems.

 - 
 If a setting changes unexpectedly, check layer link/override state before assuming data loss (see 
 Layers & Expressions).


 - 
 Check About for the product version when reporting a bug.

---

<!-- VoicingControlsReference.tsx -->
# Voicing Controls Reference

<>

## Voicing Controls In Detail



 These controls appear in VOICING and, in condensed form, across
 Dashboard/Layer workflows. Each control changes how harmonic material becomes notes. See 
 Harmony & Voicing for workflow context and 
 Theory Appendix for the underlying concepts.





 


 Control	
 Subfeatures	
 Use It When...	
 






 Chord / Scale	
 Chord quality, scale family, compatible harmonic vocabulary.	
 You need to choose what harmony the voicing button represents.	
 


 Key	
 Root note, enharmonic naming, linked/overridden key context.	
 
 You need the same harmonic shape in a different tonal center (see 
 Theory Appendix).
 
 


 Chord Prefix	
 Letter, roman numeral, solfege, and related display modes.	
 
 The chord should be read by function instead of pitch name, or vice versa (see 
 Theory Appendix).
 
 


 Spelling	
 Sharp/flat enharmonic preference.	
 The displayed note names are musically correct but visually awkward.	
 


 Inversion	
 Root position and inversion choices.	
 You want a different chord tone in the lower part of the voicing.	
 


 Octave	
 Base octave for upper voices.	
 The voicing is in the wrong register for the instrument.	
 


 Bass	
 Normal, pedal, voice-lead modes; bass value; velocity; sustain override.	
 The lower note should follow a different rule than the upper voicing.	
 


 Voice Count	
 Number of generated notes, often with enable/power behavior.	
 The part is too thin, too dense, or needs instrument-specific note count.	
 


 Spacing	
 Per-voice or global distance between generated notes.	
 The voicing sounds crowded, too open, muddy, or too narrow.	
 


 Voice Lead	
 Mode, register range, reverse-on-boundary, low interval limits.	
 
 Chord changes sound jumpy or low voices collide (see 
 Harmony & Voicing).
 
 


 Smart Chord	
 Scale-vs-chord mode and practical note selection.	
 
 You want generated notes to avoid awkward or overly dissonant choices (see 
 Harmony & Voicing).
 
 


 Sustain C.T.	
 Common-tone sustain, optional bass inclusion.	
 Shared notes between chords should connect smoothly.	
 


 Sustain	
 General note length from short to held.	
 The part needs staccato, legato, or held-note behavior.	
 


 Strum	
 Inter-note offset and anticipation.	
 A chord should feel played rather than triggered as one block.	
 


 Dynamics	
 Velocity, deviation, swells, depth, length, position.	
 The part needs humanized loudness or phrase-shaped velocity movement.	
 






### Power, Link, And Override Behavior



 - **Power toggles:** Some modules can be enabled or disabled without forgetting their settings.

 - 
 **Linked controls:** Follow the parent context and avoid unnecessary local variation. See 
 Layers & Expressions.


 - **Overrides:** Store a local value for the current layer, bank, voicing button, or expression.

 - **Auto-unlink:** Editing a linked control may create a local override so the change has somewhere to live.





### Recommended Adjustment Order



 - Set Chord / Scale, Key, and Spelling.

 - Set Inversion, Bass, Octave, Voice Count, and Spacing.

 - Use Voice Lead and Low Interval Limits for motion and clarity.

 - Add Sustain, Sustain C.T., Strum, and Dynamics for performance feel.

 - 
 Use Expressions when you need alternate versions instead of
 replacing the main setting.

---

<!-- VoicingViewGuide.tsx -->
# Voicing View Guide

<>

## VOICING View




 VOICING is the detailed chord-to-MIDI shaping workspace. It controls how Cymasphere turns harmonic intent into
 concrete notes: spelling, register, bass behavior, density, spacing, motion, sustain, strum, and dynamics. See 
 Harmony & Voicing for the musical overview and 
 Voicing Controls In Detail for per-control reference.




### Top Bar




 


 Control	
 Purpose	
 






 Breadcrumbs	
 
 Shows the current song/palette/bank/voicing button/expression context and lets you jump through hierarchy.
 See Layers & Expressions.
 
 


 Layer Manager	
 
 Opens the layer hierarchy so you can navigate, lock, and edit context-specific settings. See 
 Secondary Windows Reference.
 
 


 Play Voicing	
 Auditions the current voicing without leaving the editor.	
 






### Control Groups




 


 Group	
 Controls	
 What They Decide	
 






 Pitch context	
 Chord/Scale, Key, Chord Prefix, Spelling	
 What harmony is named, which notes are available, and how notes are displayed.	
 


 Register	
 Inversion, Octave, Bass	
 Which chord tone is low, what range the upper voices occupy, and how bass behaves.	
 


 Density and spacing	
 Voice Count, Spacing, Smart Chord	
 How many notes play, how far apart they sit, and which chord tones are favored.	
 


 Motion	
 Voice Lead, Low Interval Limits, boundary behavior	
 How voices move between chords and how low-register clashes are avoided.	
 


 Performance	
 Sustain C.T., Sustain, Strum, Dynamics	
 
 How long notes hold, whether common tones connect, how chords are staggered, and how velocity moves.
 
 






### Layer Linking




 Cymasphere settings can inherit through a hierarchy: Song → Palette → Bank → Voicing Button → Expression.
 A linked setting follows its parent; an overridden setting belongs to the current context. Song/Palette-only
 settings (key, voice leading, sustain, strum, chord prefix) live on SP settings — edits made while viewing
 a bank or voicing still apply at the palette. If an edit seems to affect too much or too little, check
 whether that control is linked or overridden before changing the musical value. See
 Layers & Expressions.




### Common Voicing Moves




 - 
 **Too muddy:** Raise octave, reduce voice count, widen spacing, or enable low interval limits.


 - **Too thin:** Increase voice count, add bass, or reduce spacing.

 - **Jumpy changes:** Increase voice-leading strength and check inversion choices.

 - **Too mechanical:** Add dynamics, strum, sustain, or expression variation.

 - **Wrong notation:** Adjust spelling or chord prefix before changing the actual harmony.





### View Behavior




 VOICING uses the full window for focused editing: the songbar, lower keyboard, and floating action button are
 hidden. Return to PALETTE to perform voicing buttons, 
 TRACK to edit track output, or 
 SONG to see the arrangement.

---

<!-- WorkspaceTour.tsx -->
# Workspace Tour

<>

## Workspace Tour



 Cymasphere uses a stable frame around the workspace: the topbar chooses the main view, the songbar handles
 transport and progression timing, the lower keyboard supports performance, and the floating action button opens
 context-specific creation actions.




### Topbar



 - 
 **Logo:** Opens audio/MIDI settings in contexts where Cymasphere owns the audio device manager
 (see Settings, Help & Account).


 - 
 **View tabs:** SONG, 
 TRACK, PALETTE, 
 VOICING, and MIXER in
 standalone builds.


 - 
 **Help button:** Toggles contextual help popups for supported UI controls.


 - 
 **Profile button:** Opens settings, hotkeys, account, restore, MIDI, performance, and theme tools
 (see Settings, Help & Account).






### Songbar And Recording



 The Songbar holds transport and progression timing. See 
 Transport & Progressions for loop, metronome, ghost track,
 and chord-block workflows. Right-click the Record button for performance-sensitive recording options such as 
 MIDI THRU and 
 SNAP TO GRID.




### Profile Menu Reference



 


 Item	
 Purpose	
 Availability	
 




 {menuReferences.map((item) => (


 
 {item.sectionId ? (
 {item.label}
 ) : (
 item.label
 )}
 
 
 {item.description}
 {item.sectionId && (
 <>
 
 See .
 
 )}
 
 {item.availability}	
 
 ))}

---

# Part 2 — CymaSynth User Manual

<!-- About.tsx -->
# About

/**
 * @fileoverview About section: version and copyright (CymaSynth User Manual).
 * @module sections/About
 */

import { memo } from 'react';
import { getCymaSynthVersion, MANUAL_VERSION } from '../version';
import { ManualLink } from '../components/ManualLink';
import { RelatedLinks } from './RelatedLinks';

export const About = memo(function About() {
 const year = new Date().getFullYear();
 const version = getCymaSynthVersion();
 return (
 <>

## About



 **CymaSynth User Manual** v{MANUAL_VERSION} — documents CymaSynth plugin v{version}. Written for
 producers and engineers using CymaSynth as an AU, VST3, or standalone instrument. Start with the 
 for an overview, or jump to for hands-on
 workflows.




 Open the manual anytime from **Settings → User Manual**. Plugin version and copyright appear under 
 **Settings → About** (About CymaSynth dialog). For shortcuts and troubleshooting, see the 
 .



© {year} NNAudio. All rights reserved.

---

<!-- Appendix.tsx -->
# Appendix

<>

## Appendix



### Keyboard shortcuts



 


 Shortcut	
 Action	
 






 ⌘N (Mac) / Ctrl+N	
 New Preset	
 


 ⌘S (Mac) / Ctrl+S	
 Save Preset	
 


 ⌘⇧S (Mac) / Ctrl+Shift+S	
 Save As…	
 


 Esc	
 
 Cancel MIDI Learn; close the topmost open overlay (preset name/delete dialogs, About, MIDI Channels, Global
 Settings, LFO Editor, Preset Browser, or preset ⋮ menu)
 
 


 Option/Alt-click	
 Reset control to default	
 


 ← / →	
 
 Previous / next preset when not typing in a field. When an OSC, FX, or MATRIX tab button is focused, the
 same keys move between main tabs instead — see .
 
 


 S	
 Toggle favorite (★) on current preset	
 


 1 / 2 / 3	
 Switch to OSC / FX / MATRIX tab	
 


 ← / → (tab focused)	
 Move between OSC, FX, and MATRIX tabs (wraps at the ends)	
 






### What saves with a preset



 - All oscillator, sub, and noise settings

 - All five envelopes, LFOs, and filters

 - Modulation matrix routes and macro assignments — see

 - FX chain (types, parameters, order as stored)

 - Voice mode, glide, master volume, global tune, and pitch bend range

 - Polyphony limit (max voices in poly mode)

 - Filters 1 & 2 serial/parallel routing and F1 ↔ F2 blend (Global Settings)

 - Per-filter routing, type, and parameters for all five filter slots

 - Optional MIDI CC map (embedded in the preset file) — see





### What stays local (not in the preset file)



 - Which tab you were viewing (OSC, FX, or MATRIX)

 - Which ENV, LFO, or FILTER sub-tab was selected

 - Accent color and palette theme (remembered per machine / plugin instance)

 - Favorite stars in the Preset Browser

 - Your default MIDI map (unless you save/load through Global Settings)

 - 
 CPU/RAM meter toggle (diagnostics preference)






 **Note:** Filter 1/2 routing is saved in presets _and_ cached locally so your last Global
 Settings choice can persist between launches — loading a preset restores that patch's routing values.




### Troubleshooting



 


 Problem	
 Things to check	
 






 No sound	
 
 At least one oscillator, sub, or noise must be enabled. Check MAIN
 volume. Confirm MIDI input and channel filter (Settings → MIDI Channels — see 
 ).
 
 


 FX seems inactive	
 
 Raise the slot's MIX control. Enable the effect power button. Factory presets often keep FX at 0% wet — see 
 .
 
 


 Filter has no effect	
 
 MIX must be above 0% and at least one source must be routed to that filter slot — see 
 .
 
 


 MIDI controller does nothing	
 
 Verify routing in your DAW, learn a CC again, and check that the control shows a C badge — see 
 . Standalone: pick the correct device under Audio / MIDI Settings.
 
 


 UI looks wrong or stale	
 
 Reload the plugin window. For a full cache reset in standalone, launch with 
 **?clearCache=1** appended to the UI URL (support workflow) or reinstall the plugin.
 
 


 Red error bar at top	
 
 The host surfaced a UI or preset error — read the message in the alert bar. Reload the plugin; if it
 persists, try another preset or Save As to a new Custom name.
 
 


 High CPU	
 
 Reduce unison voices, disable unused LFOs, clear unused FX slots, and enable Settings → CPU / RAM meter to
 monitor load.
 
 


 LFO not modulating	
 
 Turn on the LFO tab power button. Confirm a route exists and depth is not 0%.
 In FREE mode the LFO runs without notes; RETRIG needs note input — see .
 
 


 Cannot save over preset	
 
 Factory presets are read-only. Use Save As… to create a Custom copy, then Save updates that copy — see 
 .
 
 


 MATRIX shows no velocity/mod wheel rows	
 
 Expected — the grid lists LFO, ENV, and Macro routes only. Velocity, mod wheel, and similar preset
 expression routes appear on knobs via the A popover and depth pills, not as matrix rows.
 
 






### MIDI quick reference



 


 Message	
 Range / notes	
 In CymaSynth	
 






 Note On / Off	
 MIDI notes 0–127 (A0 = 21, C8 = 108)	
 On-screen piano A0–C8; velocity 1–127 on each note	
 


 Velocity	
 1–127 (1 = softest)	
 Often routed to level or filter in factory presets	
 


 Pitch bend	
 ±8192 center (14-bit)	
 PITCH wheel; range set via right-click on PITCH label	
 


 Mod wheel	
 CC1, 0–127	
 No on-screen wheel; common factory route to cutoff or vibrato	
 


 Aftertouch	
 Channel pressure	
 Matrix / preset routes when your keyboard sends it — see 
 


 MIDI channel	
 1–16	
 Filter under Settings → MIDI Channels	
 


 Custom CC	
 CC0–CC127	
 MIDI Learn on continuous knobs (shows C badge) — see 
 






### Glossary



 


 Term	
 Meaning	
 




 {glossaryEntries.map(({ term, definition, sectionId }) => (


 
 {sectionId ? {term} : term}
 
 
 {definition}
 {sectionId && (
 <>
 
 See .
 
 )}
 
 
 ))}






### At a glance



 


 Task	
 Where	
 






 Browse sounds	
 
 Click preset name or ◀ ▶ — see 
 
 


 Save your patch	
 
 ⋮ → Save As… (factory) or Save (custom) — see 
 
 


 Modulate a knob	
 Drag ENV/LFO/MACRO tab onto control, or tab	
 


 MIDI hardware control	
 Right-click knob → MIDI Learn	
 


 Filter routing	
 
 FILTER tab → route buttons (OSC A/B/C/SUB/NOISE) — see 
 
 


 Serial vs parallel F1/F2	
 
 Settings → Global Settings — see 
 
 


 Open this manual	
 Settings → User Manual	
 






### Working in a DAW



 - 
 **Automation:** Touch any control with an **A** badge while your host's
 automation write mode is on. Lanes appear in Logic, Ableton, Reaper, etc., like any other instrument.


 - 
 **Multiple instances:** Each plugin copy keeps its own preset and MIDI map. Use Settings → MIDI
 Channels per instance if several share one MIDI port.


 - 
 **Tempo and transport:** BPM-synced LFOs follow the host tempo. Enable LFO **DAW** for
 phase locked to play/stop — see .


 - 
 **Freeze / bounce:** Heavy unison and long reverb tails are CPU-friendly when frozen to audio —
 same as any CPU-heavy synth.


 - Save the project to recall sound, automation, and MIDI CC mappings together.





### Export this manual to PDF



 - Open the manual from **Settings → User Manual**.

 - 
 Click **Print / Save PDF** above the search box, or press **⌘P** (Mac) / 
 **Ctrl+P** (Windows).


 - In the print dialog, choose **Save as PDF** (or your system's PDF printer).

 - Enable **Background graphics** if you want borders and section styling.

 - Use default margins; layout is tuned for US Letter (8.5×11).





### Manual search



 Use the search field at the top of this manual to find text across all sections. Press **Enter** for
 the next match and **Shift+Enter** for the previous match. Match count appears beside the field.




### About CymaSynth (in-app)



 **Settings → About** shows the plugin version and copyright. This user manual (v{MANUAL_VERSION})
 documents CymaSynth v{getCymaSynthVersion()} and is the full feature reference — open it anytime from Settings →
 User Manual. For version details, see .

---

<!-- Effects.tsx -->
# Effects

<>

## Effects



 The FX tab hosts a **dynamic effects chain**. Effects run after the voice sum — after 
 and the amplitude — and before the master output. Add only what you need; an empty chain adds no
 processing overhead.




### FX card layout


Each effect slot is a card with three regions:



 - 
 **Header:** Effect icon and name (e.g. DISTORTION), **⏻** power toggle, and 
 **×** delete.


 - 
 **Visualizer:** Canvas that reflects the current settings (drive curve, filter response, etc.).


 - 
 **Knobs:** Type-specific parameters plus **MIX** at the end of the row.






### Adding an effect (step by step)



 - Open the **FX** tab.

 - Click **+ ADD EFFECT**.

 - 
 Pick a type from the menu: Distortion, Chorus, Delay, Reverb, Flanger, Phaser, Compressor, Equalizer, or
 Limiter.


 - A new card appears in the chain — enable it with the power button and raise **MIX** to hear it.

 - Adjust the effect's knobs; modulate key parameters from the if needed.




When no effects are in the chain, the empty state shows **No effects added** with a reminder to click **Add Effect**. Use **CLEAR ALL** to remove every slot at once (confirmation required).



### Working with the chain



 - 
 **ADD EFFECT:** Opens the type menu (same list as above).


 - 
 **Power button (⏻):** Bypass an individual slot without deleting its settings.


 - 
 **MIX:** Dry/wet for that slot. At 0% you hear no effect — many factory presets keep FX mix at 0
 until you raise it.


 - 
 **× (delete):** Remove a slot from the chain.


 - 
 **CLEAR ALL:** Remove every effect at once — a confirmation dialog titled 
 **Clear All Effects** appears first (this cannot be undone).






 Effects process in the order they appear in the chain (top to bottom). There is no drag-to-reorder in the
 current version — delete and re-add if you need a different order (for example, place reverb last so delay
 feeds into the room).




 The **effect type** is chosen when you add a slot from the + ADD EFFECT menu. To switch from
 Chorus to Delay, delete the card (×) and add a new effect — type cannot be changed in place.




### Suggested chain order



 - Tone shaping: Distortion, EQ, Phaser, Flanger, Chorus (near the source)

 - Time: Delay (before reverb so echoes are washed in space)

 - Space: Reverb

 - Dynamics: Compressor, then Limiter last for peak safety





 Each effect card shows a small visualizer canvas — it reflects drive, tone, or time settings for quick feedback.




### Dropdown controls on FX cards



 Some effects use **dropdown menus** instead of knobs: Distortion **TYPE**, Reverb 
 **TYPE**, Equalizer **L.TYPE** / **H.TYPE**, and Phaser 
 **SHAPE**. These are not MIDI-learnable — use your DAW's automation for discrete parameters if
 needed. All other controls on the card are continuous knobs.




### Modulating effects



 The engine exposes a focused set of modulatable FX parameters (listed per effect below). Drag an LFO or envelope
 onto a knob, or assign routes in the tab.




### Effect reference



 **Default** values apply when you add a new slot from + ADD EFFECT. Factory presets often keep 
 **MIX** at 0% until you raise it. For a compact table of all FX parameters, see 
 .


 {fxTypeDocs.map((fx) => (
 

#### {fx.name}


{fx.purpose}



 **Modulatable:** {fx.modulatable.join(', ')}




 


 Control	
 Default	
 What it does	
 




 {fx.params.map((p) => (


 {p.label}	
 {p.default ?? '—'}	
 {p.description}	
 
 ))}




 
 ))}

---

<!-- Envelopes.tsx -->
# Envelopes

<>

## Envelopes



 Five envelopes (ENV 1–5) shape parameters over time using attack, hold, decay, sustain, and release (ADSR+H).
 Each envelope has a visual editor: drag the nodes on the curve to change times, and adjust segment curves for
 snappier or softer transitions.




### ENV 1 vs ENV 2–5



 All five envelopes share the same ADSR+H controls, but the engine assigns fixed roles to the first three slots
 in most patches:




 - 
 **ENV 1 — Amplitude (always):** Controls how loud each note is over its lifetime. You do not
 route ENV 1 manually for volume — it drives the main amp envelope. Short attack and decay = pluck; long attack =
 swell or pad.


 - 
 **ENV 2 — Filter 1:** When a preset or route sends ENV 2 to Filter 1,
 the filter opens and closes with that envelope (classic “filter envelope” on slot 1) — see 
 .


 - 
 **ENV 3 — Filter 2:** Same dedicated role for the second filter slot in serial/parallel setups.


 - 
 **ENV 4 — Filter 3:** Modulates Filter 3 cutoff when routed (factory presets often use the matrix).


 - 
 **ENV 5 — Filters 4 and 5:** One envelope shape can drive both Filter 4 and Filter 5 cutoff in
 the engine — useful for late-chain sweeps on filters 4/5 together.


 - 
 **Any ENV → anything:** Beyond those defaults, drag any ENV tab onto a knob or add a matrix row
 to modulate pitch, WT POS, FX, glide, or even another envelope's attack time.






### Parameters (each envelope)



 


 Control	
 What it does	
 






 ATK (Attack)	
 Time to reach full level after a key is pressed. Display may show milliseconds or seconds.	
 


 HOLD	
 
 Time the envelope stays at peak before decay begins. Use for brass-style sustains at full level before the
 decay stage, or leave at 0 for typical ADSR shapes.
 
 


 DEC (Decay)	
 Time to fall from peak to the sustain level.	
 


 SUS (Sustain)	
 Level held while the key is down (knob 0–100%). The live readout above the canvas shows sustain in dB (0 dB = full level).	
 


 REL (Release)	
 Time to fade to silence after the key is released.	
 


 Curve (per segment)	
 Attack, decay, and release each have a curve control (0–100; 50 ≈ linear). Drag the curve handles on the visualizer — there are no separate curve knobs on the strip.	
 






### Visual editor and live readouts



 - 
 The large canvas shows the ADSR+H shape for the selected ENV tab. Drag attack, hold, decay, sustain, and
 release nodes to sculpt the curve.


 - 
 Knobs below the canvas (**ATK, HOLD, DEC, SUS, REL**) stay in sync with the visualizer. Live
 readouts above the canvas show attack/hold in milliseconds, decay/release in seconds, and sustain in 
 **dB** (0 dB = full level).


 - 
 All five ENV tabs are always available — there is no per-envelope power switch; unused envelopes simply have
 no routes until you assign them.


 - 
 Segment curves bend the shape between nodes — values near 50 are roughly linear; lower or higher values add
 exponential character. Curves are edited on the visualizer (there are no separate curve knobs on the strip).


 - 
 **ENV tabs are draggable** onto any modulatable control for quick assignment (same as LFO and macro
 tabs). Fine-tune depth in the or via the A badge popover.


 - 
 You can modulate envelope times themselves from the (meta-modulation) — for example,
 an changing ENV 2 decay for evolving plucks.






### Sound-design examples



 - 
 **Pluck:** ENV 1 — fast attack, low sustain, medium release. Optionally ENV 2 — short decay on
 filter cutoff.


 - 
 **Pad:** ENV 1 — slow attack (500 ms–2 s), high sustain, long release. Filter envelope slow and
 subtle.


 - 
 **Brass swell:** ENV 1 — medium attack, full sustain; ENV 2 — opening filter through the attack
 phase.

---

<!-- Filters.tsx -->
# Filters

<>

## Filters



 Five filter slots let you sculpt tone aggressively or subtly. Each slot has its own type, cutoff, resonance,
 drive, mix, and routing from (OSC A, B, C, Sub, and Noise). Use the FILTER 1–5 tabs to switch which slot you
 are editing — the knob row always shows the active slot.




### One panel, five slots



 The FILTER section uses a **single shared knob row** and one set of route buttons. Click 
 **FILTER 1–5** tabs to edit each slot — the display canvas, TYPE, CUTOFF, routes, and MIX all
 switch to that slot's stored values. Changes are saved per slot when you switch tabs or save the preset.




### Filter display and routing



 Each filter tab shows a **response curve** canvas above the controls — it updates when you change
 TYPE, CUTOFF, or RES. Below the canvas, **route buttons** (OSC A, B, C, SUB, NOISE) toggle which
 sources feed the **currently selected** filter slot. Highlighted buttons mean that source is routed
 in; click to toggle off. Sources not routed to any filter still play on the dry path (see below).




### Per-filter controls



 


 Control	
 What it does	
 






 TYPE	
 
 Dropdown: LP 12, LP 24, HP 12, HP 24, BP (band-pass), or NOTCH. Steeper 24 dB slopes roll off faster than
 12 dB. Not MIDI-learnable — use host automation if your DAW exposes it.
 
 


 CUTOFF	
 Filter frequency from 20 Hz to 20 kHz (logarithmic knob).	
 


 RES	
 Resonance emphasis at the cutoff — classic squelch when turned up on low-pass modes.	
 


 BW	
 Bandwidth — widens or narrows the resonance peak.	
 


 DRIVE	
 Pushes the filter harder for saturation and growl.	
 


 MIX	
 Wet amount for this slot. At 0% the slot does not process audio even if routes are set.	
 


 PAN	
 Stereo position of this filter's output.	
 


 Route buttons	
 
 Toggle which oscillators feed this filter. Sources with no route buttons lit on any filter still play on a 
 **dry path** (unfiltered) and are summed with the filtered signal.
 
 






### Filters 1 and 2 — serial or parallel



 Open **Settings → Global Settings → Filters 1 & 2** to choose how the first two slots
 combine — see :




 - 
 **Serial:** Filter 1 processes its routed sources first; Filter 2 receives that result plus any
 sources routed only to Filter 2. Classic “double filter” sweeps.


 - 
 **Parallel:** Each filter processes only its own routed sources. The 
 **F1 ↔ F2 blend** slider (Global Settings) crossfades between Filter 1 (0%) and Filter 2 (100%).
 Good for keeping sub clean while filtering mids on another path.






### Filters 3, 4, and 5



 These always run **after** the Filter 1/2 stage in series. Each adds its routed sources to the bus,
 applies its filter, and passes the result down the chain. Factory init patches often leave filters 3–5 at full
 mix but with no routes — they stay bypassed until you assign sources.




### Filter envelopes



 


 Envelope	
 Typical use	
 






 
 ENV 1
 
 Amplitude only (not filter cutoff).	
 


 
 ENV 2
 
 Filter 1 cutoff modulation.	
 


 
 ENV 3
 
 Filter 2 cutoff modulation.	
 


 
 ENV 4
 
 Filter 3 cutoff (via matrix or preset routing).	
 


 
 ENV 5
 
 Filters 4 and 5 cutoff (shared ADSR from the ENV 5 tab).	
 






 Assign envelope amount by dragging an tab to CUTOFF or by adding a route in the 
 . Velocity, key tracking, and can modulate cutoff as well.




### Key tracking and filter level



 Filter cutoff can follow keyboard pitch so higher notes open the filter automatically. Factory presets may
 include key-tracking modulation; add or adjust routes in the matrix targeting 
 **Filter N key tracking** when building custom patches for playable leads — see 
 .




 **Filter level** is a valid matrix destination for each slot but has no dedicated knob on the panel
 — use the matrix or factory preset routes if you need per-filter gain staging.




### Producer tips



 - High-pass one filter path and low-pass another in parallel for EDM bass (sub stays mono and clean).

 - Use notch filters for thin, telephonic or sci-fi tones.

 - Modulate CUTOFF with an at tempo sync for rhythmic filter movement.

---

<!-- Introduction.tsx -->
# Introduction

<>

## Introduction



 **CymaSynth** is a software synthesizer from NNAudio. Use it as an 
 **AU** or **VST3** plugin inside your DAW, or launch the 
 **standalone** app to play and design sounds without a host.




### What you get



 CymaSynth is a full-featured subtractive/wavetable synth built for modern production: three main 
 plus sub and noise, five and 
 , five routable , a flexible 
 chain, two performance macros, and a . The factory
 library includes **517 presets** across bass, lead, pad, keys, drums, and more — browse them in 
 .




### Signal flow


Audio moves through the instrument in this order:



 - 
 **Oscillators** (A, B, C, Sub, Noise) are summed according to each filter's routing
 buttons — see .


 - 
 **Filters 1–5** shape the tone. Filters 1 and 2 can run in series or parallel; filters 3–5
 always follow in series when their mix is raised — see .


 - 
 **ENV 1** controls amplitude (how loud each note is over time) — see .


 - 
 The **FX chain** adds distortion, delay, reverb, and other processors — see 
 .


 - 
 **MAIN** volume sets your output level. The engine also applies a fixed 
 **output safety limiter** (always on, not a front-panel control) so dense chords and FX do not
 clip digitally — add an optional **Limiter** FX slot for more control.






### Quick start



 - 
 Click the **preset name** in the header (or use ◀ ▶) to browse sounds — see 
 .


 - 
 Open the **OSC** tab to adjust oscillators, envelopes, LFOs, and filters — see 
 .


 - 
 Switch to **FX** to add effects and raise each slot's **MIX** — see 
 .


 - 
 Use **MATRIX** or drag an LFO/ENV/Macro tab onto a knob to add movement — see 
 .






### Opening the interface



 - 
 **Plugin (AU or VST3):** Insert CymaSynth on an instrument track and open the plugin window. The
 host handles audio routing; enable MIDI input on the track for your keyboard.


 - 
 **Standalone:** Launch CymaSynth as its own app. Open Settings → Audio / MIDI Settings to pick
 your audio output and MIDI input device before playing.






### First-time checklist



 - Load a factory preset (click the preset name → pick Bass, Lead, or Pad).

 - Play the on-screen keyboard or your MIDI controller.

 - Switch to OSC and move FILTER 1 CUTOFF to hear tone change.

 - Try the ◀ ▶ preset arrows to compare sounds.

 - When ready to save your own version: ⋮ menu → Save As…





### What CymaSynth does not include



 There is no built-in arpeggiator, step sequencer, stem-separation tool, or dedicated sustain-pedal (MIDI CC64)
 mapping. MIDI from your controller and host automation are supported; use your DAW's MIDI tools for
 arpeggiation, sequencing, or to route a sustain pedal if your workflow needs it. For velocity, pitch bend, and
 mod wheel detail, see .




### Polyphony and voice behavior



 In **POLY** mode, each note uses its own voice up to the engine limit (up to 64 voices; many
 factory presets use a lower effective count for CPU headroom). In **MONO** mode, only one note sounds
 at a time — ideal for bass and solo lines. Overlapping notes in mono can glide when **GLIDE** is
 raised. Voice mode is saved with each preset; there is no separate polyphony slider on the front panel — see 
 .




### Plugin vs standalone state



 - 
 **DAW projects** recall the plugin state (sound, automation, optional MIDI map) when you reopen
 the session — independent of the default preset you set in CymaSynth.


 - 
 **Standalone** opens with your **Set as Default** preset unless you load another
 patch; use Settings → Audio / MIDI Settings for device and buffer configuration.


 - 
 **Host automation** records parameters that show an **A** badge on their knobs —
 same as most virtual instruments. See the for DAW tips.






### Velocity and expression



 Playing harder or softer on your MIDI keyboard changes **velocity**. Many factory presets route
 velocity to level, filter cutoff, or brightness. **Aftertouch** (channel pressure) and 
 **pitch bend** are supported when your controller and host send them. The mod wheel (MIDI CC1) is
 a common source for vibrato and filter movement — see .




### How to use this manual



 Sections follow the interface layout. Use the **Contents** sidebar to jump to any topic:




 


 Section	
 Covers	
 






 
 Header, tabs, OSC layout, settings, badges, shortcuts, Global Settings	
 


 
 Poly/mono, glide, pitch wheel, macros, keyboard, meters	
 


 
 Notes, velocity, pitch bend, mod wheel, aftertouch	
 


 
 OSC A/B/C, Sub, Noise (top row), wavetable catalog	
 


 
 ENV 1–5, ADSR+H editor, filter-envelope roles	
 


 
 LFO strip, tempo sync, LFO Editor modal	
 


 
 Five slots, routing, serial/parallel F1/F2	
 


 
 FX chain, card layout, per-effect controls and defaults	
 


 
 Routes, depth, drag-drop assignment	
 


 
 Browser, categories, save/rename, favorites	
 


 
 Step-by-step bass, lead, pad, and drum workflows	
 


 
 Learn, default map, preset map loading	
 


 
 All controls in table form	
 


 
 Shortcuts, troubleshooting, glossary, PDF export	
 


 
 Manual and plugin version, copyright	
 






 - 
 **Find in content** — search box at the top; **Enter** = next match, 
 **Shift+Enter** = previous; ↑ ↓ buttons when multiple matches exist.


 - 
 **PDF** — use **Print / Save PDF** at the top, or see the 
 for full steps.

---

<!-- LFOs.tsx -->
# LFOs

<>

## LFOs



 Five low-frequency oscillators (LFO 1–5) add cyclic or one-shot modulation — vibrato, filter sweeps, pan
 motion, and more. Turn a slot on with its power button, then assign it by dragging the LFO tab onto a parameter
 or by building routes in the tab.




 **Important:** LFO strength is set per assignment in the (depth −100% to
 +100%), not with a single depth knob on the LFO strip.




### LFO power and tabs



 Each LFO has a small **power** button on its tab — the LFO only acts as a modulation source when
 powered on. Switch tabs to edit LFO 2–5; the strip controls always affect the currently selected LFO. LFO tabs
 are **draggable** onto parameters for quick assignment (same as envelope and macro tabs); dragging
 does not reorder or swap LFO slots.




### LFO strip controls (OSC tab)



 


 Control	
 What it does	
 






 Power	
 Enables the LFO as a modulation source.	
 


 RATE	
 Speed in Hz, or note divisions when tempo sync is on.	
 


 PHASE	
 Start phase offset (0–360°).	
 


 RISE, DELAY, SMOOTH	
 Shape a fade-in when Mode is set to Envelope.	
 


 MODE	
 
 Dropdown: **FREE** — runs continuously; **RETRIG** — restarts on each note; 
 **ENVELOPE** — one-shot shaped movement.
 
 


 BPM / Hz / DAW	
 
 Toggle buttons: **Hz** = free-running rate; **BPM** = tempo-synced divisions; 
 **DAW** = phase follows host transport.
 
 


 TUP (tuplet)	
 Triplet, quintuplet, and other tuplets when tempo-synced.	
 


 DOT	
 Dotted note timing when tempo-synced.	
 






### LFO display and expand (⤢)



 The small canvas next to the LFO tabs previews the current wave. Click **⤢ Expand** to open the
 full **LFO Editor** modal for shape editing. Rate, phase, sync, and mode controls remain on the OSC
 strip while the modal is open.




### LFO Editor


Open the editor for wave shape and advanced types. Rate and sync stay on the main OSC strip.



 - 
 **Type — Normal:** Periodic LFO with selectable wave.


 - 
 **Type — Custom:** Draw your own shape on the canvas — drag nodes to move; click or 
 **Option+click** to add a point; **Control+click** or right-click a node to delete.
 Use **Load** to import sine, tri, saw, or square as a starting point.


 - 
 **Type — Chaos Lorenz / Rössler:** Non-repeating chaotic modulation for evolving textures.


 - 
 **Type — S&H (Sample & Hold):** Stepped random values on each cycle.


 - 
 **Wave (Normal type):** Sine, Triangle, Saw, Square, or Random.


 - 
 **Dir:** Dropdown — **FWD**, **REV**, or **Ping** (ping-pong)
 playback through the waveform.


 - 
 **Load (Custom type only):** Import Sine, Tri, Saw, or Sqr as a starting shape for your custom curve.


 - 
 **Close:** Click **×**, click outside the dialog (backdrop), or press 
 **Esc**.






### BPM rate divisions



 With **BPM** active, the **RATE** knob steps through these note values (from fastest to
 slowest):




 


 Division	
 Typical use	
 






 1/16	
 Fast tremolo, hi-hat-style filter chatter	
 


 1/8	
 Upbeat wobble, short pan cycles	
 


 1/4	
 Classic quarter-note filter sweep	
 


 1/2	
 Half-note movement on pads	
 


 1/1	
 One cycle per bar	
 


 2/1, 4/1, 8/1, 16/1	
 Multi-bar evolution — very slow texture shifts	
 






### Tempo sync tips



 - 
 Switch the rate control to **BPM** and turn **RATE** to pick a division from the table
 above.


 - 
 **DOT** adds dotted timing; **TUP** adds tuplets (3, 5, 7, 9, 11) for shuffle-like
 rhythms.


 - 
 **DAW** mode locks phase to the host transport — LFO restarts or holds with play/stop depending on
 mode (FREE / RETRIG / ENVELOPE). See for host tempo context.


 - Combine slow filter LFO with faster pitch vibrato on a second LFO for classic lead sounds.





### Starter assignments



 - LFO 1 → Filter 1 CUTOFF at 15–30% depth for a gentle filter wobble — see .

 - LFO 2 → OSC A FINE at low depth for vibrato; increase depth for extreme detune FX.

 - LFO 3 → WT POS for evolving wavetable pads — see .

---

<!-- MIDIExpression.tsx -->
# MIDIExpression

<>

## MIDI Notes & Expression



 CymaSynth responds to standard MIDI note messages and several performance controllers. Expression is often
 built into factory presets via the even when you do not see a dedicated knob for it.




### Playing notes



 - 
 **Hardware keyboard or DAW piano roll:** Sends note on/off with velocity. Route MIDI to the
 CymaSynth instrument track (not only to a MIDI effect before the synth).


 - 
 **On-screen piano:** 88 keys from A0 to C8 — click a key or drag across keys to glissando. The
 first note uses full velocity; sliding to new keys while holding uses a slightly lower velocity for a natural
 legato feel — see .


 - 
 **MIDI channels:** Filter which channels CymaSynth listens to under Settings → MIDI Channels.






### Velocity



 How hard you strike a key (MIDI velocity 1–127) affects the sound when presets route velocity to level, filter
 cutoff, brightness, or attack time. Soft playing stays mellow; hard playing opens the filter or increases
 volume. Velocity routes are applied by the engine in factory presets — they show on the destination via the 
 **A** popover, not as rows in the MATRIX tab. If a patch feels the same at all dynamics, load a
 preset with velocity mapping or design your own matrix routes from or 
 sources.




### Pitch bend



 - 
 The on-screen **PITCH** wheel sends standard pitch bend. The readout shows bend in semitones; hover
 the label for the current ± range. Your hardware wheel and the on-screen control combine when both are used.


 - 
 **Right-click the PITCH label** to set bend range: ±1, 2, 3, 5, 7, 12, or 24 semitones. Menu items
 show as **±N semitones**. Default is ±2. Wider ranges suit FX and guitar-style bends.


 - 
 Bend range is saved with the preset and restored when you load a patch.






### Mod wheel (MIDI CC1)



 The mod wheel is not shown on screen — use your keyboard's wheel or assign CC1 in your DAW. Many presets
 map CC1 to filter cutoff, vibrato depth, or macro-style swells. Avoid learning CC1 to a different parameter if
 you rely on those factory routes. See for custom assignments.




### Aftertouch (channel pressure)



 If your controller sends aftertouch, factory presets can route it to brightness, vibrato, or volume. It is not a
 separate knob in the UI and does **not** appear as a row in the MATRIX tab. After loading a preset,
 check the destination control's **A** popover or depth pills to see if aftertouch is assigned
 (same as velocity, mod wheel, and pitch wheel preset routes).




### Other MIDI controllers



 Continuous controls (knobs and faders) are mapped with **MIDI Learn** — see 
 . Pitch bend and mod wheel are fixed MIDI message types, not learned as
 arbitrary CCs on those same wheels.

---

<!-- MidiCcMapping.tsx -->
# Midi Cc Mapping

<>

## MIDI CC Mapping



 Map knobs and faders on your MIDI controller to CymaSynth parameters. Learned CCs set the base value of a
 control; modulation from and still applies on top.




### Learn a control



 - 
 **Right-click** any continuous parameter — , 
 , envelopes, LFOs, FX, macros, MAIN volume, GLIDE, global tune, or tuning fields.


 - Choose **MIDI Learn…**

 - Move a knob or fader on your controller.

 - 
 The binding is stored. A **C** badge appears at the bottom-left of the control. Host automation
 uses the **A** badge at the bottom-right.






 While learning, a banner at the top of the window reads 
 **MIDI Learn: move a knob on your controller (Esc to cancel)**. Press **Esc** to exit
 learn mode without assigning. **Option/Alt-click** (macOS) or **Alt-click** (Windows)
 resets a control to its default without opening the menu.




### Preset previous / next



 You can also learn MIDI CC to the header ◀ and ▶ preset buttons. A CC value of 64 or higher triggers once per
 press — useful for stepping through a set list from a foot controller.




### View or remove a mapping



 - Click the **C** badge on a mapped knob to see the CC number and remove the assignment.

 - Right-click → **Remove CC mapping** clears the binding.

 - Right-click a mapped preset arrow → view assignment details.





### What cannot be learned yet



 Discrete switches — waveform buttons, BASIC/WAVETABLE mode, filter type, effect type — are not MIDI-learnable in
 the current version. Use your DAW's MIDI learn or automation lanes for those if your host supports it.




### Global Settings — MIDI block


Open **Settings → Global Settings** for map-wide options (each applies immediately when toggled or
 clicked) — see :



 - 
 **Load MIDI map from preset:** Off by default. When off, switching presets keeps your controller
 layout. When on, each preset can replace your map with its saved assignments.


 - 
 **Save map as default / Load default map:** Stores a default CC layout that applies to new
 instances of CymaSynth on your system.


 - 
 **Clear all mappings:** Removes every CC binding and C badges.






### Where mappings are saved



 - 
 **DAW project:** Mappings save with the plugin state when you save the session.


 - 
 **Preset file:** Optional — save a preset to embed its MIDI map (only applied when load-from-preset
 is enabled).


 - 
 **Default map:** Stored in your CymaSynth application support folder separately from individual
 presets.






### Host routing



 In a DAW, route MIDI from your controller to the CymaSynth instrument track. MIDI sent only to a MIDI effect
 before the synth will not reach CymaSynth. In standalone, choose the input device under Settings → Audio / MIDI
 Settings — see .




### Mod wheel (CC1)



 Standard mod wheel messages (MIDI CC1) are recognized. Many presets route CC1 to expressive targets. If you learn
 CC1 to a different parameter, you may override those preset routes — pick a different CC for custom mappings
 when possible.

---

<!-- ModulationMatrix.tsx -->
# Modulation Matrix

<>

## Modulation Matrix



 Modulation connects a **source** (LFO, envelope, or macro) to a **destination** 
 parameter with a **depth** from −100% to +100%. Negative depth inverts the modulation direction.
 At **±100% depth**, bipolar sources such as sweep the full usable range
 of the destination (minimum at the negative peak, maximum at the positive peak). 
 and macros use a unipolar 0–100% sweep at full depth.




### Three ways to assign modulation



 - 
 **Drag and drop:** Drag an ENV, LFO, or MACRO tab onto any modulatable knob or field in the OSC
 or FX views.


 - 
 **A badge:** Click the small **A** on a control to view, adjust, or remove routes
 affecting that parameter.


 - 
 **MATRIX tab:** See every route in one list; change modulator or depth; use CLEAR ALL to reset.






### Matrix columns



 


 Column	
 Meaning	
 






 Parameter	
 The destination being modulated (shown in plain language, e.g. Filter 1 Cutoff).	
 


 Modulator	
 Dropdown: LFO 1–5, ENV 1–5, M1, or M2.	
 


 Range	
 Depth slider −100% to +100% with a live percentage readout beside the slider.	
 


 Delete (×)	
 Removes that row only — faster than opening the A popover when cleaning up a long list.	
 






### Available sources in the matrix



 The matrix **Modulator** dropdown lists **LFO 1–5**, **ENV 1–5**, and macros 
 **M1** and **M2** only. The **Parameter** column is fixed for each row — to
 target a different knob, drag a modulator tab onto that control or remove the row and assign again.




 Factory presets may also modulate parameters from **velocity**, **mod wheel**, 
 **pitch wheel**, **aftertouch**, **key tracking**, or 
 **random** sources. Those routes run in the engine and appear on the destination control (depth pills
 and the **A** popover) but do **not** appear as rows in the MATRIX tab and cannot be
 added from the matrix dropdown.




### Common destinations



 - 
 **Oscillators:** pitch (OCT/SEMI/FINE/COURSE), level, pan, WT POS, phase, shape, unison detune
 and spread, blend — see .


 - 
 **Sub and noise:** level, pan, noise filter.


 - 
 **Filters 1–5:** cutoff, resonance, drive, mix, pan, bandwidth; parallel-mode 
 **F1 ↔ F2 blend** (Global Settings / matrix) — see .


 - 
 **Global:** MAIN volume, GLIDE (portamento), master pan (matrix/preset only — no dedicated knob).


 - 
 **FX:** Selected parameters per effect (drive, time, room size, threshold, etc.) — see 
 .


 - 
 **LFO meta:** You can modulate an LFO's rate, phase, rise, delay, or smooth from another source.


 - 
 **Envelope meta:** Attack, hold, decay, sustain, and release times for ENV 1–5 can themselves be
 modulation targets.






### Starter recipes



 - 
 **Filter sweep:** LFO 1 → Filter 1 CUTOFF, depth 20%, tempo-synced quarter notes.


 - 
 **Pluck:** ENV 2 → Filter 1 CUTOFF, depth 40–60%, short decay on ENV 2.


 - 
 **Performance macro:** Drag MACRO 1 to Filter 1 CUTOFF and Reverb MIX; one knob opens the patch
 for a breakdown or drop.


 - 
 **Vibrato:** LFO 2 → OSC A FINE, depth 5–15%, rate around 5 Hz.






### Editing and removing routes



 - 
 In the MATRIX tab, change the **Modulator** dropdown on a row to swap LFO 1 for LFO 2 (or any
 other source) while keeping the same depth.


 - 
 Drag the **Range** slider or edit depth via the A-badge popover on the destination knob.


 - 
 Delete a single route with the row **×** in the MATRIX tab, from the A popover (× on each row),
 or remove everything with **CLEAR ALL** (the app asks you to confirm before clearing all routes).


 - 
 Multiple routes to the same parameter stack — e.g. ENV 2 and LFO 1 both on Filter 1 CUTOFF — for complex
 movement.






### Mod wheel routes



 Factory presets may assign **mod wheel** (MIDI CC1) to parameters such as filter cutoff. These
 appear in the A-badge popover as “Mod wheel” with a depth pill. They are not created through the matrix
 dropdown but respond to your keyboard mod wheel in real time — see .




### Empty matrix



 With no routes, the MATRIX tab shows an empty state: **No modulation routes** and a reminder to
 drag LFO, ENV, or macro tabs onto parameters. Routes appear as rows automatically when you assign modulation —
 there is no separate “add row” button.




### Limits



 - There is no modulation curve picker in the matrix UI — depth is linear from the slider.

 - MIDI CC learn sets a base parameter value; the matrix still applies on top of that base — see 
 .

 - 
 Key tracking and envelope-amount on filters are valid destinations in presets; key tracking is not a separate
 knob on the filter panel — assign via modulation if your preset does not include it.

---

<!-- Navigation.tsx -->
# Navigation

<>

## Navigation & UI



 CymaSynth uses a header bar for presets and global controls, three main tabs for sound design, and a keyboard
 rail at the bottom of the OSC view for performance. On first open, a short loading animation appears while the
 interface and preset library initialize.




### Color and layout



 Major sections ( , , , 
 , ) use accent colors that follow your chosen theme or
 palette. This helps you scan the OSC tab quickly when jumping between sound sources and modulation.




### Header bar



 - 
 **Logo:** CymaSynth branding.


 - 
 **Tabs:** **OSC**, **FX**, and **MATRIX**. With a tab
 focused, use **←** / **→** arrow keys to move between tabs, or press 
 **1**, **2**, or **3** to jump directly (when not typing in a field).


 - 
 **Presets:** ◀ ▶ previous/next preset; click the preset name to open the Preset Browser; ★
 toggles favorite; ⋮ opens New, Save, Save As, Rename, Set as Default, and Delete. After you edit a loaded
 patch, an asterisk (*****) appears beside the preset name until you save — see 
 .


 - 
 **Settings (gear):** Audio/MIDI, color themes, diagnostics, and help — see below.


 - 
 **MAIN:** Master output volume (0–100%). Can be modulated from the .






### Main tabs



 


 Tab	
 What you do here	
 






 OSC	
 
 Oscillators A, B, C; Sub; Noise; envelopes ENV 1–5; LFOs 1–5; filters FILTER 1–5; voice mode, glide,
 pitch wheel, macros, and on-screen keyboard.
 
 


 FX	
 
 Add, enable, and edit effects in a chain. Each slot has its own MIX and power button. Use CLEAR ALL to
 remove every effect.
 
 


 MATRIX	
 
 View and edit modulation routes: which LFO, envelope, or macro affects which parameter, and by how much.
 
 






### OSC tab layout



 The OSC tab splits into two regions. The **top row** holds sound sources left to right: 
 **OSC A**, **OSC B**, **OSC C**, **SUB**, and 
 **NOISE**. The **bottom panel** contains envelopes, LFOs, filters, and the keyboard
 rail (voice mode, glide, pitch wheel, macros, meters, and on-screen piano).



#### OSC sub-tabs (envelope, LFO, filter)



 - 
 **ENV 1–5:** Select an envelope to edit. Drag a tab onto any modulatable control to assign it
 quickly.


 - 
 **LFO 1–5:** Power button per LFO. Drag tabs to assign; open the LFO Editor (expand button) for
 wave shape and type.


 - 
 **FILTER 1–5:** Click tabs to switch slots (not draggable). One shared knob row; each slot has its own
 routing, type, and mix.






### Settings menu (gear icon)


#### Audio & MIDI



 - 
 **Audio / MIDI Settings:** Standalone only — opens the native JUCE dialog to choose audio output,
 input, MIDI devices, sample rate, and buffer size. Hidden when running as an AU/VST3 plugin (the host owns
 audio and MIDI routing).


 - 
 **MIDI Channels:** Listen to all channels or restrict input to channels 1–16.


 - 
 **Global Settings:** Master tuning, filter 1/2 routing (serial vs parallel), and MIDI CC map
 options.





#### Color Themes



 Pick an accent color: Cyan, Purple, Green, Orange, Amber, Red, Blue, Pink, Teal, Lime, Indigo, or Rose. 
 **Palette** buttons cycle through gradient themes (Ocean, Sunset, Forest, Berry, Rainbow, Coral,
 Mint, Royal, Violet, Fire, Sea, and more). Your theme choice is remembered on this machine (stored locally and
 in the plugin state). It is not saved inside individual preset files.



#### Diagnostics



 - 
 **CPU / RAM meter:** Shows live processor and memory use for the plugin process.





#### Help



 - 
 **User Manual:** Opens this manual in a separate window.


 - 
 **About:** Version and copyright information — see .






### Knob badges and context menu


Right-click any continuous control for options:



 - 
 **Reset to default** — restores the parameter (same as Option/Alt-click on macOS).


 - 
 **MIDI Learn…** — bind a hardware MIDI CC — see .


 - 
 **Remove CC mapping** — clears a learned CC.


 - 
 **View modulation…** — opens a popover listing every route to that parameter (source, depth, and ×
 to remove). Use it when several modulators target one knob.






 Small badges on knobs: **A** (bottom-right) means host automation or an active mod route; 
 **C** (bottom-left) means a MIDI CC is mapped to that control.




### Adjusting controls



 - 
 **Knobs:** Click and drag vertically (or use the range input). Many knobs show a colored arc
 indicating the current value.


 - 
 **Numeric fields** (OCT, SEMI, FINE, COURSE, phase): drag up/down to change, or 
 **double-click** to type an exact value.


 - 
 **Waveform / mode buttons:** Click Sine, Tri, Sqr, Saw, BASIC, or WAVETABLE to switch — not
 MIDI-learnable, but automatable from your DAW when exposed.


 - 
 **Modulation depth pills:** When a parameter is modulated, colored pills may appear near the A
 badge — drag vertically to change that route's depth without opening the matrix. Color indicates source
 type (LFO, envelope, or macro).


 - 
 **Modulation line:** A thin animated line along the bottom of a control means it is being
 modulated in real time (knobs, tuning fields, phase, and glide).


 - 
 **Pinch / Ctrl+scroll:** On trackpads, pinch-to-zoom enlarges the interface (100–200%) for
 smaller screens; scroll bars appear when zoomed in.






### Performance meter (optional)



 Enable **Settings → Diagnostics → CPU / RAM meter** to show a small HUD with processor load and
 memory use. CPU reflects audio-thread load relative to buffer size; your DAW's own CPU meter may read
 differently. Use it to spot heavy unison counts or large FX chains.




### Global Settings dialog



 Open via **Settings → Global Settings**. Every control in this dialog applies 
 **immediately** as you move sliders or click buttons — tune offset, filter routing, F1 ↔ F2 blend,
 and MIDI map options all send to the engine right away. **OK** and **Cancel** only
 close the dialog; Cancel does **not** undo changes you already made.




 - 
 **Global tune:** −100 to +100 cents offset for the entire instrument. Saved with presets; can be
 MIDI-learned from Global Settings (not a modulation-matrix destination).


 - 
 **Filters 1 & 2:** Serial or Parallel routing. In parallel, **F1 ↔ F2 blend** 
 crossfades between the two filter outputs (0% = all Filter 1, 100% = all Filter 2). The blend slider is
 disabled in Serial mode. Filters 3–5 always follow in series (hint text in the dialog) — see 
 .


 - 
 **MIDI CC mapping:** Load map from preset toggle, save/load default map, clear all mappings —
 see .






 Filter 1/2 serial vs parallel and the F1 ↔ F2 blend are also stored in your browser's local settings so they
 persist between sessions; they are **also saved in each preset** when you Save or Save As.




### MIDI Channels dialog



 Open via **Settings → MIDI Channels**. The dialog title is 
 **Select MIDI Input Channels**. Click channels **1–16** to toggle each one, or choose 
 **All Channels** for no filter (accept MIDI on any channel). Press **OK** to apply or 
 **Cancel** to discard. Useful when multiple virtual instruments share one MIDI port.





 See for the bottom keyboard rail.

---

<!-- Oscillators.tsx -->
# Oscillators

/**
 * @fileoverview Oscillators section of the CymaSynth User Manual.
 * @module sections/Oscillators
 */
import { wavetableLibrary } from '../data/wavetables';
import { memo, useMemo } from 'react';
import { ManualLink } from '../components/ManualLink';
import { RelatedLinks } from './RelatedLinks';

export const Oscillators = memo(function Oscillators() {
 const wavetableGroups = useMemo(() => {
 const groups = new Map ();
 for (const wt of wavetableLibrary) {
 const list = groups.get(wt.group) ?? [];
 list.push(wt);
 groups.set(wt.group, list);
 }
 return groups;
 }, []);

 return (
 <>

## Oscillators



 Five main oscillators (OSC A, B, C), a sub oscillator one or two octaves below the played note, and a noise
 generator appear left to right across the top of the OSC tab. Layer them for thickness, route different sources
 to different , or keep one osc for a focused sound.




### OSC A, B, and C


Each main oscillator shares the same control set:



 - 
 **Status dot:** Click to enable or disable the oscillator.


 - 
 **BASIC / WAVETABLE:** Dropdown at the top of each osc module — classic waveforms or morphing
 wavetables.


 - 
 **Waveform (BASIC):** Click **Sine**, **Tri**, **Sqr**, or 
 **Saw** — the active button is highlighted. **WT POS** is greyed out in BASIC mode.


 - 
 **Wavetable (WAVETABLE mode):** A **dropdown** appears with all 38 tables; the name
 also shows on the display. Use **WT POS** (0–100%) to scan frames — great for evolving pads and
 bass wobbles.


 - 
 **Wavetable display click:** Toggles between **full** (all frames) and 
 **single** (one frame) preview on the canvas — it does not open a separate picker.


 - 
 **OCT, SEMI, FINE, COURSE:** Numeric tuning fields — drag vertically to change or double-click to
 type. **COURSE** spans −12 to +12 semitones in fine steps. Stack oscs at +7 semitones for fifths,
 or detune FINE for width.


 - 
 **Φ (Phase):** Fixed start phase 0–360°. Double-click to type a value.


 - 
 **RAND:** Randomizes start phase per note (0–100%) for thicker, less static unison — available on
 OSC A, B, and C.


 - 
 **LEVEL:** Output level 0–100%.


 - 
 **UNISON, DETUNE, SPREAD:** Stack 1–16 voices, spread their pitch (DETUNE), and widen them in
 the stereo field (SPREAD).


 - 
 **PAN, BLEND, SHAPE:** Stereo position, unison blend, and wave shaping (including PWM-style
 movement on square waves).






### Sub oscillator



 - 
 **Status dot:** Click to enable or disable the sub oscillator.


 - 
 **OCT:** −12 or −24 semitones below the played note (step in 12 semitone increments).


 - 
 **Waveform buttons:** **Sin**, **Tri**, **Sqr**, or 
 **Saw** — the sub uses abbreviated labels; main oscillators show **Sine** instead of Sin.


 - 
 **Φ:** Start phase 0–360° (no RAND control on sub).


 - 
 **PAN:** 0–100 with **50 = center** (not the ±100 range used on OSC A/B/C).


 - 
 **LEVEL:** Sub output 0–100%.






 Tip: Route sub only to Filter 1 and keep osc A on Filter 2 in parallel (Global Settings) for independent low
 and mid processing — see and .




### Noise



 - 
 **Status dot:** Click to enable or disable the noise generator.


 - 
 **TYPE:** White (bright), Pink (balanced), or Brown (dark) noise — dropdown at the top of the module.


 - 
 **FILTER:** Built-in tone control on the noise source.


 - 
 **PAN:** 0–100 with **50 = center**.


 - 
 **LEVEL:** Noise amount 0–100%.





Use noise lightly for breath, hi-hats, or layered texture — a little goes a long way.



### Practical tips



 - 
 At least one source must be enabled or you will hear silence. Init presets enable OSC A by default.


 - 
 When layering three oscs, lower individual LEVEL settings to avoid clipping before the filter.


 - 
 Wavetable mode shines when you modulate **WT POS** from an or 
 .






### Wavetable library



 CymaSynth includes {wavetableLibrary.length} wavetables. Choose one from the **dropdown** in
 WAVETABLE mode; click the display to toggle full-frame vs single-frame preview.


 {[...wavetableGroups.entries()].map(([group, entries]) => (
 

#### {group}



 


 Name	
 Character	
 




 {entries.map((wt) => (


 {wt.name}	
 {wt.description}	
 
 ))}




 
 ))}

---

<!-- ParameterReference.tsx -->
# Parameter Reference

<>

## Parameter Reference



 Quick lookup for every major control. Ranges match what you see in the interface. This appendix is for power
 users who want a single table — the main sections (such as , 
 , and ) explain how to use each area musically.




 ↑ Back to contents


 {paramGroups.map(({ group, params }) => {
 const sectionId = groupSectionLinks[group];
 return (
 

### 
 {sectionId ? (
 <>
 {group} — see 
 
 ) : (
 group
 )}




 


 Control	
 Range	
 Default	
 Description	
 




 {params.map((p) => (


 {p.label}	
 {p.range}	
 {p.default ?? '—'}	
 {p.description}	
 
 ))}




 
 );
 })}

### Effects (per slot)



 Each FX slot has a power button, type-specific controls, and MIX. See the section
 for chain workflow. Modulatable parameters are listed per type below.


 {fxTypeDocs.map((fx) => (
 

#### {fx.name}


Modulatable: {fx.modulatable.join(', ')}



 


 Control	
 Default	
 Description	
 




 {fx.params.map((p) => (


 {p.label}	
 {p.default ?? '—'}	
 {p.description}	
 
 ))}




 
 ))}

### Modulation destinations (by module)


Any control listed below can be a modulation target when you drag an LFO, ENV, or Macro onto it or add a 
 row.

 {modDestinationGroups.map(({ group, destinations }) => {
 const sectionId = modDestSectionLinks[group];
 return (
 

#### 
 {sectionId ? (
 <>
 {group} — see 
 
 ) : (
 group
 )}




 {destinations.map((d) => (
 - {d}

 ))}


 
 );
 })}

### Modulation sources in factory presets only



 These may modulate parameters in loaded factory presets. They appear on destination controls (A popover and depth
 pills) but are **not** listed in the tab and cannot be chosen from the
 Modulator dropdown — see for velocity, mod wheel, and aftertouch behavior:




 {presetOnlyModSources.map((s) => (
 - {s}

 ))}

---

<!-- Presets.tsx -->
# Presets

<>

## Presets



 A preset stores the complete sound: , , 
 , all five , modulation routes, 
 chain, macro assignments, optional MIDI CC mappings, and global settings such as
 voice mode and glide. CymaSynth ships with **517 factory presets**; your own saves appear under
 Custom.




### Preset Browser



 Click the **preset name** in the header to open the Preset Browser window — see 
 .




 - 
 **Categories (left):** Scroll the list — Favorites and Custom appear first, then factory
 categories sorted alphabetically with preset counts.


 - 
 **Presets (right):** Click any name to load immediately. The header preset name updates to match.


 - 
 **Search:** Type in the search field to filter the current category by name (partial matches). If
 nothing matches, the list shows **No matching presets** or 
 **No matching presets in this category**.


 - 
 **Close:** Click × or click outside to dismiss without changing the sound (if you have not clicked
 a new preset).






 The ★ button in the header marks favorites — favorites are stored on your machine, not inside each preset file.




### Factory vs Custom



 - 
 **Factory presets** ship with CymaSynth and cannot be overwritten. Use **Save As…** 
 to duplicate one into Custom before editing.


 - 
 **Custom presets** are your saved sounds. They appear in the Custom category and support Save,
 Rename, and Delete.


 - 
 **Init** presets are minimal starting points — good bases for new patches.






### Categories


Factory presets are grouped by sound type. Select a category on the left to list only those patches:



 


 Category	
 Typical use	
 How to audition	
 




 {presetCategoryGuide.map(({ id, description, listeningNotes }) => (


 
 {presetCategorySections[id] ? (
 {id}
 ) : (
 id
 )}
 
 {description}	
 {listeningNotes}	
 
 ))}






 Favorited presets show a ★ in the browser list. Search filters names within the **currently selected** 
 category — switch categories or clear search to see the full bank again.




### Header controls



 - ◀ ▶ — step through presets in the current list order (also **←** / **→** when focus is not in a text field).

 - ⋮ menu — New, Save, Save As, Rename, Set as Default, Delete.

 - ★ — toggle favorite for the current preset (also press **S** when not typing).

 - 
 **Modified indicator:** After you change any parameter, the preset name shows a trailing 
 ***** until you Save or load another preset.






### Keyboard shortcuts



 


 Action	
 Mac	
 Windows	
 






 New Preset	
 ⌘N	
 Ctrl+N	
 


 Save Preset	
 ⌘S	
 Ctrl+S	
 


 Save As…	
 ⌘⇧S	
 Ctrl+Shift+S	
 


 Previous / Next preset	
 ← / →	
 ← / →	
 


 Toggle favorite (★)	
 S	
 S	
 


 Switch tab (OSC / FX / MATRIX)	
 1 / 2 / 3	
 1 / 2 / 3 — see 
 






### Saving and managing custom presets



 - 
 **New Preset** starts from the current sound and assigns a new name on save.


 - 
 **Save** overwrites the active user preset. Factory presets cannot be overwritten — the Save item is
 disabled in the ⋮ menu (use Save As… instead).


 - 
 **Save As…** creates a new entry under Custom.


 - 
 **Rename** and **Delete** apply to user presets only.


 - 
 Preset names are limited to **50 characters** in the save/rename dialog.






### Rename and Delete dialogs



 Choosing **Rename** or **Delete** from the ⋮ menu opens a confirmation dialog. Type the
 new name for Rename, or confirm Delete — factory presets cannot be renamed or deleted (you will see an error
 toast instead). Duplicate names are rejected when saving or renaming.




### Status toasts



 Brief messages appear near the header after preset actions: green for success (Saved, Saved as, Created), red
 for errors (factory preset protected, duplicate name, save failed). They fade automatically after a few seconds.




### Default preset



 **Set as Default** chooses which patch loads when CymaSynth opens fresh. Your DAW may still recall
 a different sound when reopening a saved project — that is normal host behavior.




### MIDI maps and presets



 By default, changing presets does **not** replace your MIDI CC assignments. Enable 
 **Load MIDI map from preset** in Global Settings if you want each preset to bring its own
 controller map (useful for live sets with per-song mappings) — see .

---

<!-- SoundDesign.tsx -->
# Sound Design

<>

## Sound Design Workflows



 These step-by-step starting points help you build common instrument types from Init or a nearby factory preset.
 Adjust to taste — CymaSynth rewards experimentation with the and 
 routing.




### Starting from Init (blank patch)



 - 
 Open the Preset Browser → **Init** category → pick **Init** (or any Init variant) —
 see .


 - 
 Confirm **OSC A** is enabled (status dot lit). Raise **LEVEL** if needed; disable B/C
 until you want layering.


 - 
 Set **Filter 1** to **LP 24**, route OSC A, and sweep **CUTOFF** while playing the
 on-screen keyboard.


 - 
 Shape ENV 1 (amplitude): short attack for plucks, long attack and sustain for pads.


 - 
 Add movement: drag LFO 1 onto Filter 1 **CUTOFF**, then open 
 to set depth (start around 20%).


 - 
 When it sounds right: ⋮ → **Save As…** under Custom.






### Bass



 - Start from a **Bass** factory preset or Init with OSC A on, others off.

 - Enable **Sub** at −12 or −24 semitones; keep LEVEL moderate.

 - Set **VOICE** to MONO; add a small amount of **GLIDE** for legato slides — see 
 .

 - 
 **Filter 1:** LP 24, route OSC A + Sub, cutoff around 30–50%, resonance to taste.


 - ENV 1: short attack, medium decay, low sustain for a tight hit — or higher sustain for dub sustain — see 
 .

 - Optional: LFO tempo-synced to Filter 1 CUTOFF for wobble; use MACRO 1 for live cutoff sweeps.





### Lead



 - Load a **Lead** preset or use one main osc in BASIC saw/square with light unison (2–4 voices).

 - ENV 1: fast attack, full sustain, medium release for held notes.

 - LFO 2 → OSC A FINE at low depth (5–12%) for vibrato; increase RATE for faster wobble.

 - Filter 1: moderate cutoff; ENV 2 → Filter 1 CUTOFF for brightness that follows each note.

 - Add **Delay** or **Chorus** in with MIX 20–40% for space.





### Pad



 - Layer OSC A + B in WAVETABLE mode with different tables; detune SEMI (+7, −7) for width.

 - UNISON 4–8 voices, DETUNE and SPREAD up for stereo wash.

 - ENV 1: attack 500 ms–2 s, high sustain, release 1–3 s.

 - LFO 1 → WT POS on both oscs for slow evolution; tempo-sync at 1/2 or 1 bar.

 - Filter 1: low-pass with low cutoff; open slightly with ENV 2 or an LFO.

 - FX: Reverb MIX 25–50%, optional Chorus for shimmer.





### Pluck / keys



 - Fast ENV 1 attack (~0 ms), short decay, zero or low sustain, release 100–400 ms.

 - ENV 2 → Filter 1 CUTOFF with medium depth so each note “pops” brighter then darkens.

 - Keep unison low (1–2 voices) for clarity; optional noise burst for attack grit.

 - Minimal FX; short plate reverb if needed (low MIX).





### Drums / percussion



 - Browse **Drums** factory presets — many use noise, short envelopes, and band-pass filters.

 - For custom kicks: Sub + noise click, HP filter on noise, very short ENV 1.

 - Use MONO voice and single-note triggering; velocity-sensitive routes in presets add dynamics.





### Layering and headroom



 - When stacking three oscillators, reduce each LEVEL so the sum does not clip before filtering.

 - Use **parallel filters** (Global Settings) to process sub and mids independently — see 
 .

 - Raise FX MIX gradually — factory sounds often keep effects at 0% until you need space or grit.

 - Watch the L/R meters; use MAIN or a Limiter slot if peaks clip in your DAW.





### Performance and arrangement



 - Assign MACRO 1 to filter cutoff + reverb mix for build-ups; MACRO 2 to WT POS or drive.

 - Automate MAIN, cutoff, or FX in your DAW — parameters with an A badge accept host automation (see 
 ).

 - Save variations with Save As under Custom for verse/chorus/drop versions of the same patch.

---

<!-- VoiceKeyboard.tsx -->
# Voice Keyboard

<>

## Voice, Keyboard & Performance



 The bottom of the OSC tab holds voice settings, pitch bend, performance macros, level meters, and an on-screen
 piano for auditioning patches. Layout left to right: **VOICE** / **GLIDE** on the left
 rail, **PITCH** wheel and the piano in the center, **MACRO 1** / **MACRO 2** 
 and **L** / **R** meters on the right — see for the full
 OSC layout.




### Voice mode



 - 
 **POLY:** Each note gets its own voice up to the preset's polyphony limit. Best for chords,
 pads, and polyphonic parts.


 - 
 **MONO:** One note at a time. When you hold a note and play another, the pitch can glide if 
 **GLIDE** is up; releasing all keys allows the release phase to finish before the next attack.
 Ideal for bass lines and lead solos.






### Glide (portamento)



 **GLIDE** sets portamento time from 0 to 2 seconds (0 = off). The control is labeled 
 **mono only** in the UI — pitch slides between overlapping notes in **MONO** voice
 mode when you play legato. In **POLY**, glide has no effect on overlapping notes. Double-click the
 glide slider to reset to 0. Glide is also a modulation destination if you want an or 
 to change slide time during a performance.




### Pitch wheel



 The vertical **PITCH** wheel sends pitch bend. It returns to center when you release the mouse
 (same as releasing a hardware wheel). The numeric readout below the wheel shows the current bend in semitones
 (for example **0**, **+1.2**, or **−2**). Right-click the 
 **PITCH** label to choose bend range. See for available ranges
 and behavior with hardware controllers.




### Macros (MACRO 1 and MACRO 2)



 Two performance knobs sit beside the keyboard. Each macro can control multiple parameters at once:




 - Drag **MACRO 1** or **MACRO 2** onto any modulatable knob or field.

 - Turn the macro knob to move all assigned parameters together.

 - 
 Right-click a macro (or its assignment badge) to view or remove individual targets and adjust per-target
 depth.






 Macros appear in the as **M1** and **M2**. They are saved
 with presets.




### Mod wheel



 There is no on-screen mod wheel — use your MIDI controller or DAW. See for
 how CC1 interacts with factory presets and custom CC learn.




### On-screen keyboard



 The piano spans **88 keys (A0–C8)**, matching a full concert range. Click a key for a single note,
 or click and drag across keys to glissando. Useful in standalone mode or for quick auditioning in a plugin.
 For detailed MIDI behavior, see .




### Output meters



 **L** and **R** meters show peak output level after the master volume. Watch them
 when pushing drive, distortion, or limiter settings in the chain.




### MIDI channels



 By default CymaSynth listens to all MIDI channels. Use Settings → MIDI Channels to restrict input if multiple
 instruments share one cable or virtual port — see .

---

# CymaSynth Glossary

## ADSR+H
Attack, Hold, Decay, Sustain, Release — the envelope stages that shape a sound over time.

## Basic mode
Classic analog waveforms: sine, triangle, square, and saw.

## Wavetable mode
Morphing through stored single-cycle waves; WT POS scans between frames.

## Unison
Multiple detuned copies of an oscillator for a thicker sound.

## Portamento / Glide
Pitch slide between notes in mono mode, controlled by the GLIDE knob (0–2 s).

## Modulation route
A connection from a source (LFO, ENV, macro) to a destination parameter with a depth.

## Full-span modulation
At ±100% matrix depth, an LFO sweeps a parameter from its minimum to maximum across the wave; envelopes and macros sweep the unipolar 0–100% range.

## Mix (filter or FX)
Wet amount — at 0% the slot does not affect the sound. FX MIX behaves the same way — see Effects.

## Serial filters
Filter 2 processes the output of Filter 1 (stacked tone shaping).

## Parallel filters
Filters 1 and 2 process the same sources separately, then blend with F1 ↔ F2.

## Tempo sync
LFO rate locked to project BPM in musical divisions (quarter notes, bars, etc.).

## Factory preset
A read-only patch shipped with CymaSynth; duplicate with Save As to edit.

## Custom preset
A user-saved patch under the Custom category.

## A badge
Small marker on a knob meaning host automation or active modulation applies to that control.

## C badge
Marker showing a MIDI CC is mapped to that control via MIDI Learn.

## MIDI Learn
Right-click workflow that binds a hardware CC to a continuous control.

## Dotted (DOT)
LFO timing option that lengthens a synced division by 50% (dotted eighth, etc.).

## Dry path
Unfiltered audio from sources not routed to any filter — still heard in the mix.

## Preset-only modulation
Velocity, mod wheel, and similar expression sources applied by factory presets; visible on knobs via A popover, not in the MATRIX grid.

## Tuplet (TUP)
LFO timing option for triplet, quintuplet, and other non-standard divisions when BPM sync is on.

---

# Site operations appendix

Facts for the public website chatbot that are not covered by the in-app User Manuals.
Do not invent additional product features beyond the manuals above.

## Trials
- 7-day free trial without requiring a credit card
- 14-day free trial with a card on file (not charged until the trial ends)
- Both options include full access to Cymasphere features and CymaSynth

## Support contacts
- Email: support@cymasphere.com
- Discord community: https://discord.gg/gXGqqYR47B
- In-app Help / User Manual is the primary product documentation

## Installation (typical desktop paths)
- Windows standalone: C:\Program Files\Cymasphere\
- Windows VST3: C:\Program Files\Common Files\VST3\
- macOS standalone: /Applications/
- macOS plugins: /Library/Audio/Plug-Ins/
- Sign in with a Cymasphere account on first launch

## Bundle note
- CymaSynth (standalone, VST3 & AU) is included with Cymasphere subscription and lifetime licenses
