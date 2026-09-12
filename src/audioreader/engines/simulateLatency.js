/**
 * Wrap an engine so synthesis takes a while.
 *
 * SpeechSynthesis synthesizes instantly, which means the buffering behaviour
 * issue #1580 cares about -- ordered background loading, the spinner, seeks that
 * abandon in-flight work -- is invisible with that engine: everything is always
 * ready. A slow engine is the real target (PocketTTS on WASM takes on the order
 * of a second per sentence), so this wrapper lets the prototype demonstrate and
 * screenshot those behaviours before PocketTTS exists.
 *
 * Enabled by `?synthDelay=<ms>` on the demo page. Off by default.
 *
 * @param {Object} engine an object matching the player's TTSEngine interface
 * @param {number} delayMs
 * @return {Object} the same engine with a slow `synthesize`
 */
export default function simulateLatency(engine, delayMs) {
  if (!delayMs) return engine;

  const inner = engine.synthesize.bind(engine);

  engine.synthesize = (text, ctx) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ctx.signal.removeEventListener('abort', onAbort);
      resolve(inner(text, ctx));
    }, delayMs);

    function onAbort() {
      clearTimeout(timer);
      reject(new Error('synthesis aborted'));
    }

    // Honour cancellation, otherwise a seek would still be paying for work it
    // asked the queue to throw away.
    ctx.signal.addEventListener('abort', onAbort);
  });

  engine.simulatedLatencyMs = delayMs;
  return engine;
}
