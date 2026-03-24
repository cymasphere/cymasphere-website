/**
 * @fileoverview Client-side Tone.js clock configuration for reliable scheduling.
 * @module utils/toneClientConfig
 * @description Ensures the shared Tone context uses a timeout-driven ticker so
 * internal `context.setTimeout` callbacks (used by PolySynth.release scheduling)
 * actually run. The default Web Worker ticker can fail to deliver ticks in some
 * environments, which leaves notes stuck after triggerAttackRelease.
 */

import type * as ToneModule from "tone";

let clockSourcePatched = false;

/** Browser `Tone.getContext()` is a {@link Context} with `clockSource`; typings expose `BaseContext`. */
interface ToneClockContext {
  clockSource: "worker" | "timeout" | "offline";
}

/**
 * @brief Prefer the timeout-based clock source over the Web Worker ticker.
 * @description Safe to call multiple times; only the first successful application sticks.
 * @param {typeof ToneModule} tone - The Tone.js namespace (e.g. imported `* as Tone`).
 * @returns {void}
 * @note No-op on the server (`window` undefined).
 */
export function ensureToneClockUsesTimeout(tone: typeof ToneModule): void {
  if (typeof window === "undefined" || clockSourcePatched) {
    return;
  }
  try {
    const ctx = tone.getContext() as unknown as ToneClockContext;
    ctx.clockSource = "timeout";
    clockSourcePatched = true;
  } catch {
    /* Context may not be ready; a later call site can retry. */
  }
}
