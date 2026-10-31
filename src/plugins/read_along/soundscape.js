// @ts-check
import { ReadAlongAligner, tokenize } from './aligner.js';

/**
 * A soundscape is a JSON file of sounds, plus cues anchored to the book's text
 * that fire as the reader reads past them.
 *
 * @typedef {object} SoundscapeSpec
 * @property {1} version
 * @property {{ [name: string]: SoundSpec }} sounds
 * @property {CueSpec[]} cues
 *
 * @typedef {object} SoundSpec
 * @property {string} src Audio URL; needs CORS if cross-origin
 * @property {boolean} [loop]
 * @property {number} [loopStart] seconds
 * @property {number} [loopEnd] seconds
 * @property {number} [start] seconds into the file to start playing from
 * @property {number} [gain] Base level of the file, so cue volumes can be 0-1 across sounds
 * @property {string} [credit]
 *
 * @typedef {object} CueSpec
 * @property {CueAnchor} at
 * @property {SoundAction[]} actions
 *
 * @typedef {object} CueAnchor
 * @property {number} pageIndex
 * @property {string} quote Text on that page; matched leniently, so it can be copied from the scan rather than the OCR
 * @property {'start' | 'end'} [position] Fire on the first or last word of the quote. Default 'start'.
 *
 * @typedef {object} SoundAction
 * @property {'play' | 'volume' | 'stop' | 'stopAll'} action
 *   `play` on a looping sound that's already playing just changes its volume
 * @property {string} [sound] name of the sound; required except for `stopAll`
 * @property {number} [volume] 0-1, default 1
 * @property {number} [fade] seconds to fade to the new volume, default 0
 * @property {number} [delay] seconds to wait before acting, default 0
 */

/**
 * @typedef {object} ResolvedCue
 * @property {CueSpec} spec
 * @property {number} pageIndex
 * @property {number | null} wordIndex index of the anchor word among the page's read-along
 *   words; null if the page isn't loaded, in which case only its page orders it
 */

/** Cues further than this many words from the previous position aren't fired, since that's a jump, not reading */
export const MAX_CUE_JUMP = 40;

/**
 * @param {string[]} pageWords normalized words of the page
 * @param {string} quote
 * @param {'start' | 'end'} [position]
 * @returns {number} index of the anchor word, or -1
 */
export function resolveQuote(pageWords, quote, position = 'start') {
  const tokens = tokenize(quote);
  if (!tokens.length) return -1;
  const pick = (/** @type {number} */ start) => position == 'end' ? start + tokens.length - 1 : start;

  for (let i = 0; i + tokens.length <= pageWords.length; i++) {
    if (tokens.every((t, j) => pageWords[i + j] === t)) return pick(i);
  }
  // Fall back to fuzzy, for OCR errors in the quoted text
  const match = new ReadAlongAligner(pageWords).bestMatch(tokens, false);
  if (!match) return -1;
  return position == 'end' ? match.end : Math.max(0, match.end - tokens.length + 1);
}

/**
 * @param {SoundscapeSpec} spec
 * @param {Map<number, string[]>} normsByPage normalized words of the loaded pages
 * @returns {ResolvedCue[]} all cues, in reading order
 */
export function resolveCues(spec, normsByPage) {
  /** @type {ResolvedCue[]} */
  const resolved = [];
  for (const cue of spec.cues) {
    const norms = normsByPage.get(cue.at.pageIndex);
    if (!norms) {
      resolved.push({ spec: cue, pageIndex: cue.at.pageIndex, wordIndex: null });
      continue;
    }
    const wordIndex = resolveQuote(norms, cue.at.quote, cue.at.position);
    if (wordIndex == -1) {
      console.warn(`Soundscape: couldn't find "${cue.at.quote}" on page index ${cue.at.pageIndex}`);
      continue;
    }
    resolved.push({ spec: cue, pageIndex: cue.at.pageIndex, wordIndex });
  }
  return resolved.sort((a, b) => a.pageIndex - b.pageIndex || (a.wordIndex ?? 0) - (b.wordIndex ?? 0));
}

/**
 * @param {ResolvedCue} cue
 * @param {number} pageIndex
 * @param {number} wordIndex
 * @returns {number} negative if the cue is before the word, 0 if on it, positive if after
 */
export function compareCueToWord(cue, pageIndex, wordIndex) {
  return cue.pageIndex - pageIndex || (cue.wordIndex ?? 0) - wordIndex;
}

/**
 * The looping sounds that should be playing at a position, as if everything
 * before it had been read. One-shots are left out, since they'd have finished.
 * @param {SoundscapeSpec} spec
 * @param {ResolvedCue[]} cues in reading order
 * @param {number} pageIndex
 * @param {number} wordIndex
 * @returns {Map<string, number>} sound name -> volume
 */
export function loopStateAt(spec, cues, pageIndex, wordIndex) {
  /** @type {Map<string, number>} */
  const state = new Map();
  for (const cue of cues) {
    if (compareCueToWord(cue, pageIndex, wordIndex) > 0) break;
    for (const { action, sound, volume = 1 } of cue.spec.actions) {
      if (action == 'stopAll') state.clear();
      if (!spec.sounds[sound]?.loop) continue;
      if (action == 'play' || (action == 'volume' && state.has(sound))) state.set(sound, volume);
      else if (action == 'stop') state.delete(sound);
    }
  }
  return state;
}

/**
 * Plays a soundscape's sounds with Web Audio, for sample-accurate loops and
 * smooth fades.
 */
export class SoundscapePlayer {
  /** @type {AudioContext} */
  ctx = null;
  /** @type {AudioNode} Everything plays through this */
  output = null;
  /** @type {Map<string, Promise<AudioBuffer>>} */
  buffers = new Map();
  /** @type {Map<string, { source: AudioBufferSourceNode | null, gain: GainNode }>} */
  playing = new Map();

  /**
   * @param {SoundscapeSpec} spec
   */
  constructor(spec) {
    this.spec = spec;
  }

  /**
   * Must be called from a user gesture, or browsers keep the audio muted
   */
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      // Limiter, since sounds are boosted by their `gain` and can overlap
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.25;
      limiter.connect(this.ctx.destination);
      this.output = limiter;
    }
    this.ctx.resume();
    for (const name of Object.keys(this.spec.sounds)) this._buffer(name);
  }

  /**
   * @param {string} name
   */
  _buffer(name) {
    if (!this.buffers.has(name)) {
      const promise = fetch(this.spec.sounds[name].src)
        .then(r => r.arrayBuffer())
        .then(data => this.ctx.decodeAudioData(data));
      promise.catch(e => console.error(`Soundscape: failed to load sound "${name}"`, e));
      this.buffers.set(name, promise);
    }
    return this.buffers.get(name);
  }

  /**
   * @param {SoundAction} action
   */
  run(action) {
    if (action.delay) {
      setTimeout(() => this.run({ ...action, delay: 0 }), action.delay * 1000);
      return;
    }
    const { sound, volume = 1, fade = 0 } = action;
    switch (action.action) {
    case 'play': return this.play(sound, volume, fade);
    case 'volume': return this.setVolume(sound, volume, fade);
    case 'stop': return this.stop(sound, fade);
    case 'stopAll': return this.stopAll(fade);
    default: console.warn('Soundscape: unknown action', action);
    }
  }

  /**
   * @param {string} name
   * @param {number} volume
   * @param {number} fade
   */
  async play(name, volume, fade) {
    const soundSpec = this.spec.sounds[name];
    if (!soundSpec || !this.ctx) return;
    if (soundSpec.loop && this.playing.has(name)) {
      this.setVolume(name, volume, fade);
      return;
    }
    // A one-shot replaying cuts off its previous play
    this.stop(name, 0.05);

    // Registered before the buffer loads, so volume/stop cues that arrive
    // in the meantime still apply
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.output);
    /** @type {{ source: AudioBufferSourceNode | null, gain: GainNode }} */
    const entry = { source: null, gain };
    this.playing.set(name, entry);
    this.setVolume(name, volume, fade);

    const buffer = await this._buffer(name);
    if (this.playing.get(name) !== entry) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = !!soundSpec.loop;
    if (soundSpec.loopStart) source.loopStart = soundSpec.loopStart;
    if (soundSpec.loopEnd) source.loopEnd = soundSpec.loopEnd;
    source.connect(gain);
    source.onended = () => {
      if (this.playing.get(name) === entry) this.playing.delete(name);
    };
    entry.source = source;
    source.start(0, soundSpec.start ?? soundSpec.loopStart ?? 0);
  }

  /**
   * @param {string} name
   * @param {number} volume
   * @param {number} fade
   */
  setVolume(name, volume, fade) {
    const entry = this.playing.get(name);
    if (!entry) return;
    const target = volume * (this.spec.sounds[name].gain ?? 1);
    rampTo(entry.gain.gain, target, fade, this.ctx.currentTime);
  }

  /**
   * @param {string} name
   * @param {number} fade
   */
  stop(name, fade) {
    const entry = this.playing.get(name);
    if (!entry) return;
    this.playing.delete(name);
    rampTo(entry.gain.gain, 0, fade, this.ctx.currentTime);
    entry.source?.stop(this.ctx.currentTime + Math.max(fade, 0.05));
  }

  /**
   * Fade the looping sounds to the given state
   * @param {Map<string, number>} state sound name -> volume
   * @param {number} fade
   */
  applyLoopState(state, fade) {
    for (const name of [...this.playing.keys()]) {
      if (this.spec.sounds[name].loop && !state.has(name)) this.stop(name, fade);
    }
    for (const [name, volume] of state) this.play(name, volume, fade);
  }

  /**
   * @param {number} fade
   */
  stopAll(fade) {
    for (const name of [...this.playing.keys()]) this.stop(name, fade);
  }
}

/**
 * @param {AudioParam} param
 * @param {number} value
 * @param {number} fade seconds
 * @param {number} now
 */
function rampTo(param, value, fade, now) {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  // A minimum ramp avoids clicks
  param.linearRampToValueAtTime(value, now + Math.max(fade, 0.05));
}
