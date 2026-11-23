import HybridTtsEngine from '@/src/audioreader/engines/HybridTtsEngine.js';

const GRACE = 30;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const settle = () => sleep(GRACE * 4);

/**
 * A stand-in engine whose synthesis can be resolved on demand, so the race
 * between "quality arrived in time" and "fall back to a preview" is deterministic
 * rather than timing-dependent.
 * @param {string} name
 * @param {{instant?: boolean}} [opts]
 */
function makeEngine(name, { instant = false } = {}) {
  const pending = new Map();
  const played = [];
  const calls = { synthesize: 0, pause: 0, resume: 0, stop: 0, setRate: 0 };

  const engine = {
    name,
    stats: { soundsPlayed: 0, samplesPlayed: 0, peakAmplitude: 0 },
    synthesize: jest.fn((text, { signal } = {}) => {
      calls.synthesize++;
      if (instant) return Promise.resolve({ engine: name, text });
      return new Promise((resolve, reject) => {
        pending.set(text, { resolve, reject });
        signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    }),
    play: jest.fn(async (sound) => {
      played.push(sound);
      engine.stats.soundsPlayed++;
      engine.stats.samplesPlayed += 100;
      engine.stats.peakAmplitude = name === 'Quality' ? 0.5 : 0.2;
    }),
    pause: jest.fn(() => { calls.pause++; }),
    resume: jest.fn(() => { calls.resume++; }),
    stop: jest.fn(() => { calls.stop++; }),
    setRate: jest.fn(() => { calls.setRate++; }),
  };

  return {
    engine, played, calls,
    async finish(text) {
      pending.get(text).resolve({ engine: name, text });
      pending.delete(text);
      await sleep(0);
    },
    async fail(text, error = new Error('engine broke')) {
      pending.get(text).reject(error);
      pending.delete(text);
      await sleep(0);
    },
  };
}

function makeHybrid({ fastInstant = true, qualityInstant = false } = {}) {
  const fast = makeEngine('Fast', { instant: fastInstant });
  const quality = makeEngine('Quality', { instant: qualityInstant });
  const hybrid = new HybridTtsEngine({
    fast: fast.engine, quality: quality.engine, graceMs: GRACE,
  });
  return { hybrid, fast, quality };
}

const noCtx = () => ({ signal: new AbortController().signal });

describe('choosing between the engines', () => {
  test('uses the quality engine when it finishes inside the grace period', async () => {
    const { hybrid, quality, fast } = makeHybrid({ qualityInstant: true });

    const sound = await hybrid.synthesize('Hello there.', noCtx());
    await hybrid.play(sound, noCtx());

    expect(quality.played).toHaveLength(1);
    expect(fast.played).toHaveLength(0);
    // No preview was even synthesized, so no wasted work.
    expect(fast.engine.synthesize).not.toHaveBeenCalled();
    expect(hybrid.counts.quality).toBe(1);
  });

  test('falls back to a preview when the quality engine is too slow', async () => {
    const { hybrid, quality, fast } = makeHybrid();

    const sound = await hybrid.synthesize('Hello there.', noCtx());
    await hybrid.play(sound, noCtx());

    expect(fast.played).toHaveLength(1);
    expect(fast.played[0].engine).toBe('Fast');
    expect(quality.played).toHaveLength(0);
    expect(hybrid.counts.preview).toBe(1);
  });

  test('the preview is available without waiting for the slow engine', async () => {
    const { hybrid } = makeHybrid();

    const started = Date.now();
    await hybrid.synthesize('Hello there.', noCtx());
    // Bounded by the grace period, not by the quality engine, which never finishes.
    expect(Date.now() - started).toBeLessThan(GRACE * 10);
  });

  test('upgrades to the quality audio if it lands before playback starts', async () => {
    const { hybrid, quality, fast } = makeHybrid();

    const sound = await hybrid.synthesize('Hello there.', noCtx());
    // The buffer caught up between synthesis and playback.
    await quality.finish('Hello there.');

    await hybrid.play(sound, noCtx());

    expect(quality.played).toHaveLength(1);
    expect(fast.played).toHaveLength(0);
    expect(hybrid.counts.upgraded).toBe(1);
  });

  test('a replayed preview upgrades once and stays upgraded', async () => {
    const { hybrid, quality } = makeHybrid();

    const sound = await hybrid.synthesize('Hello there.', noCtx());
    await quality.finish('Hello there.');

    await hybrid.play(sound, noCtx());
    await hybrid.play(sound, noCtx());

    expect(quality.played).toHaveLength(2);
    expect(hybrid.counts.upgraded).toBe(1);
  });

  test('keeps the slow synthesis running after falling back', async () => {
    const { hybrid, quality } = makeHybrid();

    await hybrid.synthesize('Hello there.', noCtx());
    // Not abandoned: still resolvable, so a seek back gets the good audio.
    await expect(quality.finish('Hello there.')).resolves.toBeUndefined();
    expect(quality.engine.synthesize).toHaveBeenCalledTimes(1);
  });
});

describe('when the quality engine fails', () => {
  test('falls back to the fast engine for that segment', async () => {
    const { hybrid, quality, fast } = makeHybrid();

    const synthesizing = hybrid.synthesize('Hello there.', noCtx());
    await quality.fail('Hello there.');
    const sound = await synthesizing;

    // Routed to the engine that actually owns the audio.
    await hybrid.play(sound, noCtx());
    expect(fast.played).toHaveLength(1);
    expect(quality.played).toHaveLength(0);
  });

  test('does not report a quality play for a failed segment', async () => {
    const { hybrid, quality } = makeHybrid();
    const synthesizing = hybrid.synthesize('Hello there.', noCtx());
    await quality.fail('Hello there.');
    await hybrid.play(await synthesizing, noCtx());

    expect(hybrid.counts.quality).toBe(0);
  });
});

describe('transport control', () => {
  test('pause and resume reach whichever engine is playing', async () => {
    const { hybrid, fast, quality } = makeHybrid();

    await hybrid.play(await hybrid.synthesize('Preview one.', noCtx()), noCtx());
    hybrid.pause();
    hybrid.resume();
    expect(fast.calls.pause).toBe(1);
    expect(fast.calls.resume).toBe(1);
    expect(quality.calls.pause).toBe(0);
  });

  test('pause reaches the quality engine when that is what is playing', async () => {
    const { hybrid, fast, quality } = makeHybrid({ qualityInstant: true });

    await hybrid.play(await hybrid.synthesize('Quality one.', noCtx()), noCtx());
    hybrid.pause();
    expect(quality.calls.pause).toBe(1);
    expect(fast.calls.pause).toBe(0);
  });

  test('stop silences both engines, since a handover may be in flight', () => {
    const { hybrid, fast, quality } = makeHybrid();
    hybrid.stop();
    expect(fast.calls.stop).toBe(1);
    expect(quality.calls.stop).toBe(1);
  });

  test('rate changes apply to both engines so a handover does not change speed', () => {
    const { hybrid, fast, quality } = makeHybrid();
    hybrid.setRate(1.5);
    expect(hybrid.rate).toBe(1.5);
    expect(fast.calls.setRate).toBe(1);
    expect(quality.calls.setRate).toBe(1);
  });

  test('destroy tears down both engines', () => {
    const { hybrid, fast, quality } = makeHybrid();
    fast.engine.destroy = jest.fn();
    quality.engine.destroy = jest.fn();
    hybrid.destroy();
    expect(fast.engine.destroy).toHaveBeenCalled();
    expect(quality.engine.destroy).toHaveBeenCalled();
  });
});

describe('reported state', () => {
  test('surfaces the quality engine loading status, since that is what blocks', () => {
    const { hybrid, quality } = makeHybrid();
    quality.engine.status = 'loading';
    quality.engine.progress = { loaded: 5, total: 10 };
    expect(hybrid.status).toBe('loading');
    expect(hybrid.progress).toEqual({ loaded: 5, total: 10 });
  });

  test('reports ready when the quality engine has no status of its own', () => {
    const { hybrid } = makeHybrid();
    expect(hybrid.status).toBe('ready');
  });

  test('names both engines so the UI can say what is speaking', () => {
    const { hybrid } = makeHybrid();
    expect(hybrid.name).toBe('Hybrid(Quality + Fast)');
  });

  test('sums playback stats and reports the quality/preview split', async () => {
    const { hybrid, quality } = makeHybrid();

    await hybrid.play(await hybrid.synthesize('Preview one.', noCtx()), noCtx());

    const qualitySound = await (async () => {
      const synthesizing = hybrid.synthesize('Quality one.', noCtx());
      await settle();
      await quality.finish('Quality one.');
      return synthesizing;
    })();
    await hybrid.play(qualitySound, noCtx());

    const stats = hybrid.stats;
    expect(stats.soundsPlayed).toBe(2);
    expect(stats.samplesPlayed).toBe(200);
    // The louder of the two, not a sum.
    expect(stats.peakAmplitude).toBe(0.5);
    expect(stats.previewPlayed).toBe(1);
    expect(stats.qualityPlayed).toBe(1);
  });
});
