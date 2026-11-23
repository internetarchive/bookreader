import resample from '@/src/audioreader/pocket/resample.js';

/**
 * @param {number} frequency
 * @param {number} rate
 * @param {number} seconds
 * @return {Float32Array}
 */
function tone(frequency, rate, seconds) {
  const samples = new Float32Array(Math.round(rate * seconds));
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.sin((2 * Math.PI * frequency * i) / rate);
  }
  return samples;
}

/**
 * Dominant frequency by naive DFT peak. Fine for a handful of test signals.
 * @param {Float32Array} samples
 * @param {number} rate
 * @return {number}
 */
function dominantFrequency(samples, rate) {
  let bestFrequency = 0;
  let bestPower = -1;
  for (let frequency = 20; frequency < rate / 2; frequency += 5) {
    let real = 0;
    let imaginary = 0;
    for (let i = 0; i < samples.length; i++) {
      const angle = (2 * Math.PI * frequency * i) / rate;
      real += samples[i] * Math.cos(angle);
      imaginary += samples[i] * Math.sin(angle);
    }
    const power = real * real + imaginary * imaginary;
    if (power > bestPower) {
      bestPower = power;
      bestFrequency = frequency;
    }
  }
  return bestFrequency;
}

/**
 * @param {Float32Array} samples
 * @return {number}
 */
function rms(samples) {
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
}

describe('resample', () => {
  test('returns the input untouched when rates match', () => {
    const input = tone(440, 24000, 0.05);
    expect(resample(input, 24000, 24000)).toBe(input);
  });

  test('handles empty input', () => {
    expect(resample(new Float32Array(0), 16000, 24000)).toHaveLength(0);
  });

  test('upsamples 16k to 24k with the expected length', () => {
    const input = tone(440, 16000, 0.5);
    const output = resample(input, 16000, 24000);
    // 3/2 ratio, the real case for PocketTTS's reference clip.
    expect(output.length).toBe(Math.round(input.length * 1.5));
  });

  test('downsamples 48k to 24k with the expected length', () => {
    const input = tone(440, 48000, 0.5);
    expect(resample(input, 48000, 24000).length).toBe(input.length / 2);
  });

  test('preserves the tone frequency when upsampling', () => {
    const output = resample(tone(440, 16000, 0.5), 16000, 24000);
    expect(dominantFrequency(output, 24000)).toBeCloseTo(440, -1);
  });

  test('preserves the tone frequency when downsampling', () => {
    const output = resample(tone(1000, 48000, 0.3), 48000, 24000);
    expect(dominantFrequency(output, 24000)).toBeCloseTo(1000, -1);
  });

  test('preserves amplitude to within a few percent', () => {
    const input = tone(440, 16000, 0.5);
    const output = resample(input, 16000, 24000);
    expect(rms(output)).toBeCloseTo(rms(input), 2);
  });

  test('does not blow up at the signal edges', () => {
    const output = resample(tone(440, 16000, 0.5), 16000, 24000);
    // Edge normalization should keep the first and last samples in range rather
    // than letting a partially-covered kernel spike or collapse them.
    for (const sample of [output[0], output[1], output[output.length - 1]]) {
      expect(Math.abs(sample)).toBeLessThanOrEqual(1.05);
    }
  });

  test('band-limits when downsampling instead of aliasing', () => {
    // 9kHz is above the 6kHz Nyquist of a 12k output, so it must be attenuated,
    // not folded back down into the audible band as a spurious tone.
    const input = tone(9000, 24000, 0.3);
    const output = resample(input, 24000, 12000);
    expect(rms(output)).toBeLessThan(rms(input) * 0.3);
  });

  test('rejects nonsensical rates', () => {
    expect(() => resample(tone(440, 16000, 0.01), 0, 24000)).toThrow(/positive/);
    expect(() => resample(tone(440, 16000, 0.01), 16000, -1)).toThrow(/positive/);
  });
});
