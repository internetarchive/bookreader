/**
 * Sample-rate conversion for voice-cloning reference audio.
 *
 * PocketTTS's mimi encoder expects audio at the bundle's rate (24kHz for the
 * English bundle), but reference clips are whatever they are -- the sample
 * shipped with the ONNX repo is 16kHz. The Python runtime leans on
 * `scipy.signal.resample_poly`; this is the equivalent, since the voice's timbre
 * is exactly what we are trying to capture and naive interpolation colours it.
 *
 * Windowed-sinc polyphase resampling: band-limit at the lower of the two Nyquist
 * frequencies, then evaluate the filter at each output sample's position in the
 * input.
 */

/** Half-width of the filter in input samples. Larger is sharper and slower. */
const KERNEL_HALF_WIDTH = 16;

/**
 * @param {number} x
 * @return {number}
 */
function sinc(x) {
  if (x === 0) return 1;
  const scaled = Math.PI * x;
  return Math.sin(scaled) / scaled;
}

/**
 * Resample mono audio.
 * @param {Float32Array} samples
 * @param {number} fromRate
 * @param {number} toRate
 * @return {Float32Array} resampled audio, or the input untouched if rates match
 */
export default function resample(samples, fromRate, toRate) {
  if (!samples.length) return new Float32Array(0);
  if (fromRate === toRate) return samples;
  if (fromRate <= 0 || toRate <= 0) throw new Error('resample: rates must be positive');

  const ratio = toRate / fromRate;
  const outputLength = Math.max(1, Math.round(samples.length * ratio));
  const output = new Float32Array(outputLength);

  // When downsampling, the filter has to cut at the *output* Nyquist to avoid
  // aliasing; when upsampling, the input Nyquist is already the limit.
  const cutoff = Math.min(1, ratio);
  // A wider kernel in input samples is needed when downsampling, so the same
  // number of filter zero-crossings is covered.
  const halfWidth = KERNEL_HALF_WIDTH / cutoff;

  for (let i = 0; i < outputLength; i++) {
    // Position of this output sample in input-sample coordinates.
    const center = i / ratio;
    const first = Math.ceil(center - halfWidth);
    const last = Math.floor(center + halfWidth);

    let sum = 0;
    let weightSum = 0;

    for (let j = first; j <= last; j++) {
      if (j < 0 || j >= samples.length) continue;
      const offset = center - j;
      // Hann window over the kernel's support, tapering the truncation.
      const window = 0.5 * (1 + Math.cos((Math.PI * offset) / halfWidth));
      const weight = window * cutoff * sinc(cutoff * offset);
      sum += samples[j] * weight;
      weightSum += weight;
    }

    // Normalizing by the realized weight keeps gain flat at the signal edges,
    // where part of the kernel hangs off the end of the input.
    output[i] = weightSum === 0 ? 0 : sum / weightSum;
  }

  return output;
}
