// @ts-check
import { ReadAlongAligner, tokenize } from './aligner.js';

/**
 * A soundscape is a JSON file of sounds, plus cues anchored to the book's text
 * that fire as the reader reads past them.
 *
 * @typedef {object} SoundscapeSpec
 * @property {2} version
 * @property {{ [name: string]: SoundSpec }} sounds
 * @property {{ [name: string]: EffectSpec }} [effects]
 * @property {CueSpec[]} cues
 * @property {string | string[]} [styles] CSS shared by effects, e.g. keyframes, added to the page as is
 *
 * @typedef {object} SoundSpec
 * @property {string} src Audio URL; needs CORS if cross-origin
 * @property {boolean} [loop]
 * @property {number} [loopStart] seconds
 * @property {number} [loopEnd] seconds
 * @property {number} [start] seconds into the file to start playing from
 * @property {number} [end] one-shots: seconds into the file to stop at, to use only part of it
 * @property {number} [fadeOut] one-shots with an `end`: seconds to fade out before it
 * @property {number} [gain] Base level of the file, so cue volumes can be 0-1 across sounds
 * @property {string} [credit]
 *
 * @typedef {object} EffectSpec A visual effect: a class on the BookReader element while it's on
 * @property {string | string[]} [css] CSS where `&` stands for the BookReader element while the
 *   effect is on (`.BookReader.soundscape-<name>`), e.g. `& .BRfooter { scale: 1.1; }`
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
 * @property {'start' | 'set' | 'stop'} action
 *   `start` on a looping sound that's already playing just changes its volume;
 *   `set` changes a playing sound's volume without starting it
 * @property {string} [sound] the sound to act on
 * @property {string} [effect] the effect to act on
 * @property {boolean} [all] with `stop`, stop every sound and effect
 * @property {number} [volume] sounds: 0-1, default 1
 * @property {number} [fade] sounds: seconds to fade to the new volume, default 0
 * @property {number} [delay] seconds to wait before acting, default 0
 * @property {number} [duration] with `start`, seconds until it stops again; omit to keep it
 *   going (one-shot sounds stop by themselves)
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
 * @returns {{ start: number, end: number } | null} indices of the quote's first and last words
 */
export function resolveQuoteSpan(pageWords, quote) {
  const tokens = tokenize(quote);
  if (!tokens.length) return null;
  for (let i = 0; i + tokens.length <= pageWords.length; i++) {
    if (tokens.every((t, j) => pageWords[i + j] === t)) return { start: i, end: i + tokens.length - 1 };
  }
  // Fall back to fuzzy, for OCR errors in the quoted text
  const match = new ReadAlongAligner(pageWords).bestMatch(tokens, false);
  if (!match) return null;
  return { start: Math.max(0, match.end - tokens.length + 1), end: match.end };
}

/**
 * @param {string[]} pageWords normalized words of the page
 * @param {string} quote
 * @param {'start' | 'end'} [position]
 * @returns {number} index of the anchor word, or -1
 */
export function resolveQuote(pageWords, quote, position = 'start') {
  const span = resolveQuoteSpan(pageWords, quote);
  if (!span) return -1;
  return position == 'end' ? span.end : span.start;
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
    for (const { action, sound, all, duration, volume = 1 } of cue.spec.actions) {
      if (action == 'stop' && all) state.clear();
      if (!spec.sounds[sound]?.loop) continue;
      if ((action == 'start' && !duration) || (action == 'set' && state.has(sound))) state.set(sound, volume);
      else if (action == 'stop') state.delete(sound);
    }
  }
  return state;
}

/**
 * The lasting effects (started without a duration) that should be on at a
 * position, as if everything before it had been read.
 * @param {ResolvedCue[]} cues in reading order
 * @param {number} pageIndex
 * @param {number} wordIndex
 * @returns {Set<string>} effect names
 */
export function effectStateAt(cues, pageIndex, wordIndex) {
  /** @type {Set<string>} */
  const effects = new Set();
  for (const cue of cues) {
    if (compareCueToWord(cue, pageIndex, wordIndex) > 0) break;
    for (const { action, effect, all, duration } of cue.spec.actions) {
      if (action == 'stop' && all) effects.clear();
      if (!effect) continue;
      if (action == 'start' && !duration) effects.add(effect);
      else if (action == 'stop') effects.delete(effect);
    }
  }
  return effects;
}

/**
 * Whether each `set` raises or lowers its sound's volume, from replaying the
 * cues in reading order
 * @param {ResolvedCue[]} cues in reading order
 * @returns {Map<SoundAction, 'up' | 'down'>} only `set`s that change a playing sound's volume
 */
export function volumeDirections(cues) {
  /** @type {Map<string, number>} sound name -> current volume */
  const volumes = new Map();
  /** @type {Map<SoundAction, 'up' | 'down'>} */
  const directions = new Map();
  for (const cue of cues) {
    // Within a cue, actions happen in the order of their delays
    const actions = [...cue.spec.actions].sort((a, b) => (a.delay ?? 0) - (b.delay ?? 0));
    for (const action of actions) {
      const { sound, volume = 1 } = action;
      if (action.action == 'stop' && action.all) volumes.clear();
      if (!sound) continue;
      if (action.action == 'start') volumes.set(sound, volume);
      else if (action.action == 'stop') volumes.delete(sound);
      else if (action.action == 'set' && volumes.has(sound)) {
        const prev = volumes.get(sound);
        if (volume != prev) directions.set(action, volume > prev ? 'up' : 'down');
        volumes.set(sound, volume);
      }
    }
  }
  return directions;
}

/**
 * The page CSS for a soundscape: its shared styles, plus each effect's CSS
 * with `&` expanded
 * @param {SoundscapeSpec} spec
 */
export function soundscapeCss(spec) {
  const effectCss = Object.entries(spec.effects ?? {}).map(([name, { css = [] }]) =>
    [css].flat().join('\n').replaceAll('&', `.BookReader.${effectClass(name)}`));
  return [...[spec.styles ?? []].flat(), ...effectCss].join('\n');
}

/**
 * @param {string} name
 */
export function effectClass(name) {
  return `soundscape-${name}`;
}

/**
 * Plays a soundscape's sounds with Web Audio, for sample-accurate loops and
 * smooth fades, and turns its effects on and off.
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

  /** @type {Map<string, ReturnType<typeof setTimeout>>} Effects waiting on their `duration` */
  _effectTimers = new Map();
  /** @type {Set<ReturnType<typeof setTimeout>>} Actions waiting on their `delay` */
  _pending = new Set();

  /**
   * @param {SoundscapeSpec} spec
   * @param {HTMLElement} effectsEl the BookReader element, which effects add their classes to
   */
  constructor(spec, effectsEl) {
    this.spec = spec;
    this.effectsEl = effectsEl;
    const styleEl = document.createElement('style');
    styleEl.textContent = soundscapeCss(spec);
    document.head.appendChild(styleEl);
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
      const timer = setTimeout(() => {
        this._pending.delete(timer);
        this.run({ ...action, delay: 0 });
      }, action.delay * 1000);
      this._pending.add(timer);
      return;
    }
    const { action: verb, sound, effect, volume = 1, fade = 0, duration } = action;
    if (verb == 'stop' && action.all) {
      this.stopAll(fade);
      this.applyEffectState(new Set());
    } else if (sound && verb == 'start') {
      this.play(sound, volume, fade);
      if (duration) this.run({ action: 'stop', sound, fade: 0.3, delay: duration });
    } else if (sound && verb == 'set') {
      this.setVolume(sound, volume, fade);
    } else if (sound && verb == 'stop') {
      this.stop(sound, fade);
    } else if (effect && verb == 'start') {
      this.startEffect(effect, duration);
    } else if (effect && verb == 'stop') {
      this.stopEffect(effect);
    } else {
      console.warn('Soundscape: unknown action', action);
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
    source.onended = () => {
      if (this.playing.get(name) === entry) this.playing.delete(name);
    };
    entry.source = source;
    const offset = soundSpec.start ?? soundSpec.loopStart ?? 0;
    if (!soundSpec.loop && soundSpec.end != null) {
      // The trim's fade has its own gain, so `set`s on `gain` can't cancel it
      const length = Math.max(soundSpec.end - offset, 0);
      const trimGain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      trimGain.gain.setValueAtTime(1, now + Math.max(length - (soundSpec.fadeOut ?? 0), 0));
      trimGain.gain.linearRampToValueAtTime(0, now + length);
      source.connect(trimGain).connect(gain);
      source.start(0, offset, length);
    } else {
      source.connect(gain);
      source.start(0, offset);
    }
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
   * @param {string} name
   * @param {number} [duration] seconds; omit to keep it on
   */
  startEffect(name, duration) {
    const className = effectClass(name);
    clearTimeout(this._effectTimers.get(name));
    // Restart any animation, even if the effect is already on
    this.effectsEl.classList.remove(className);
    void this.effectsEl.offsetWidth;
    this.effectsEl.classList.add(className);
    if (duration) {
      this._effectTimers.set(name, setTimeout(() => this.stopEffect(name), duration * 1000));
    }
  }

  /**
   * @param {string} name
   */
  stopEffect(name) {
    clearTimeout(this._effectTimers.get(name));
    this._effectTimers.delete(name);
    this.effectsEl.classList.remove(effectClass(name));
  }

  /**
   * Turn on exactly these effects
   * @param {Set<string>} effects
   */
  applyEffectState(effects) {
    const prefix = effectClass('');
    const current = Array.from(this.effectsEl.classList)
      .filter(c => c.startsWith(prefix))
      .map(c => c.slice(prefix.length));
    for (const name of current) {
      if (!effects.has(name)) this.stopEffect(name);
    }
    for (const name of effects) {
      if (!this.effectsEl.classList.contains(effectClass(name))) this.startEffect(name);
    }
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
    for (const timer of this._pending) clearTimeout(timer);
    this._pending.clear();
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
