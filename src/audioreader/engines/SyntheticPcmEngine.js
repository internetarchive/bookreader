import PcmAudioOutput from './PcmAudioOutput.js';

/**
 * An engine that renders measurable PCM instead of speech.
 *
 * **This does not produce intelligible words.** It exists for two reasons:
 *
 * 1. *Verification.* WebSpeech hands text to the operating system and gives
 *    nothing back -- no samples, no reliable `end` event under automation (in
 *    Chromium driven by Playwright, `speechSynthesis` fires `start` and then
 *    reports `speaking` forever, headless or not). So it can prove that speech
 *    *started* but never that a sound *finished*, which means continuous
 *    paragraph-to-paragraph reading cannot be verified through it at all. This
 *    engine produces real samples with a real duration and a real `ended` event,
 *    so a browser test can assert on captured buffer length and amplitude.
 *
 * 2. *Groundwork.* PocketTTS will emit PCM at 24kHz and play it through
 *    {@link PcmAudioOutput}. This exercises that path now, so the PocketTTS work
 *    is confined to synthesis rather than synthesis plus playback.
 *
 * Timing mimics speech closely enough to be useful: roughly 2.5 words per second,
 * one tone burst per word, with brief gaps between them.
 */

/** Matches the PocketTTS bundle, so the playback path is exercised as it will be used. */
const SAMPLE_RATE = 24000;
const WORDS_PER_SECOND = 2.5;

export default class SyntheticPcmEngine {
  /**
   * @param {Object} [opts]
   * @param {number} [opts.sampleRate]
   */
  constructor({ sampleRate = SAMPLE_RATE } = {}) {
    this.name = 'SyntheticPCM';
    this.sampleRate = sampleRate;
    this.rate = 1;
    this.output = new PcmAudioOutput();
  }

  static isSupported() {
    return typeof window !== 'undefined'
      && !!(window.AudioContext || window.webkitAudioContext);
  }

  /** @return {{soundsPlayed: number, samplesPlayed: number, peakAmplitude: number}} */
  get stats() {
    return this.output.stats;
  }

  /**
   * @param {string} text
   * @return {Promise<{samples: Float32Array, sampleRate: number, text: string}>}
   */
  async synthesize(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const seconds = Math.max(0.25, words.length / WORDS_PER_SECOND);
    const total = Math.round(seconds * this.sampleRate);
    const samples = new Float32Array(total);

    const perWord = Math.floor(total / Math.max(1, words.length));
    // Leave a short silence between words so the result is audibly segmented
    // rather than one continuous drone.
    const toneLength = Math.floor(perWord * 0.8);

    words.forEach((word, index) => {
      // Pitch derived from the word, so different text sounds different and a
      // test can tell two segments apart.
      const frequency = 180 + (hash(word) % 120);
      const start = index * perWord;
      for (let i = 0; i < toneLength && start + i < total; i++) {
        // Taper both ends of the burst; abrupt edges click.
        const envelope = Math.sin((Math.PI * i) / toneLength);
        samples[start + i] = 0.25 * envelope * Math.sin((2 * Math.PI * frequency * i) / this.sampleRate);
      }
    });

    return { samples, sampleRate: this.sampleRate, text };
  }

  /**
   * @param {{samples: Float32Array, sampleRate: number}} sound
   * @param {{signal: AbortSignal}} ctx
   * @return {Promise<void>}
   */
  play(sound, ctx) {
    return this.output.play(sound, ctx);
  }

  pause() { this.output.pause(); }
  resume() { this.output.resume(); }
  stop() { this.output.stop(); }

  /** @param {number} rate */
  setRate(rate) {
    this.rate = rate;
    this.output.setRate(rate);
  }
}

/**
 * @param {string} text
 * @return {number}
 */
function hash(text) {
  let value = 0;
  for (let i = 0; i < text.length; i++) {
    value = (value * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(value);
}
