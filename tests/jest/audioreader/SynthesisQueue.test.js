import SynthesisQueue from '@/src/audioreader/SynthesisQueue.js';

const jobs = (...keys) => keys.map(key => ({ key, text: `text for ${key}` }));
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * A synthesize() stub whose jobs only settle when the test says so. Lets us assert
 * on ordering and cancellation deterministically instead of racing timers.
 */
function makeControllableSynth() {
  const pending = new Map();
  const started = [];
  const aborted = [];

  const synthesize = jest.fn((text, { signal, job }) => {
    started.push(job.key);
    return new Promise((resolve, reject) => {
      pending.set(job.key, { resolve, reject });
      signal.addEventListener('abort', () => {
        aborted.push(job.key);
        reject(new Error('aborted'));
      });
    });
  });

  return {
    synthesize, started, aborted,
    async finish(key, value = `audio:${key}`) {
      pending.get(key).resolve(value);
      pending.delete(key);
      await flush();
    },
    async fail(key, error = new Error('boom')) {
      pending.get(key).reject(error);
      pending.delete(key);
      await flush();
    },
  };
}

describe('ordered, one-at-a-time synthesis', () => {
  test('synthesizes strictly in plan order, never more than one at a time', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a', 'b', 'c'));
    await flush();

    // Only the first job has started -- the CPU is not being overloaded.
    expect(synth.started).toEqual(['a']);

    await synth.finish('a');
    expect(synth.started).toEqual(['a', 'b']);

    await synth.finish('b');
    expect(synth.started).toEqual(['a', 'b', 'c']);
  });

  test('caches results and exposes them via get/isReady/readyKeys', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a', 'b'));
    await flush();
    await synth.finish('a', 'AUDIO-A');

    expect(queue.isReady('a')).toBe(true);
    expect(queue.get('a')).toBe('AUDIO-A');
    expect(queue.isReady('b')).toBe(false);
    expect(queue.readyKeys()).toEqual(['a']);
  });

  test('does not re-synthesize what is already cached', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a', 'b'));
    await flush();
    await synth.finish('a');
    await synth.finish('b');

    // Re-plan the same segments, e.g. the patron seeked back to them.
    queue.setPlan(jobs('a', 'b'));
    await flush();
    expect(synth.synthesize).toHaveBeenCalledTimes(2);
  });

  test('fires onChange as each segment becomes ready', async () => {
    const synth = makeControllableSynth();
    const onChange = jest.fn();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize, onChange });

    queue.setPlan(jobs('a', 'b'));
    await flush();
    expect(onChange).not.toHaveBeenCalled();

    await synth.finish('a');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('seeking clears in-flight work', () => {
  test('aborts the running job when it is no longer the most urgent', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a', 'b', 'c'));
    await flush();
    expect(synth.started).toEqual(['a']);

    // Patron jumps: a totally different block is now urgent.
    queue.setPlan(jobs('x', 'y'));
    await flush();

    expect(synth.aborted).toEqual(['a']);
    expect(synth.started).toEqual(['a', 'x']);
    expect(queue.stats.aborted).toBe(1);
  });

  test('lets the running job finish when it is still the most urgent', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a', 'b'));
    await flush();

    // Re-plan with 'a' still at the front -- throwing that work away would be waste.
    queue.setPlan(jobs('a', 'z'));
    await flush();

    expect(synth.aborted).toEqual([]);
    expect(queue.stats.aborted).toBe(0);
  });

  test('a result that lands after being seeked away from is discarded', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a'));
    await flush();
    queue.setPlan(jobs('b'));
    await flush();

    // 'a' was aborted, but suppose the engine resolved anyway (a racy engine).
    expect(queue.isReady('a')).toBe(false);
    expect(queue.readyKeys()).toEqual([]);
  });

  test('rapid seeks leave exactly one job running', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    for (const key of ['a', 'b', 'c', 'd', 'e']) {
      queue.setPlan(jobs(key));
      await flush();
    }

    const outstanding = synth.started.length - synth.aborted.length;
    expect(outstanding).toBe(1);
    expect(synth.started[synth.started.length - 1]).toBe('e');
  });
});

describe('eviction', () => {
  test('drops cached segments that leave the plan', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a', 'b'));
    await flush();
    await synth.finish('a');
    expect(queue.isReady('a')).toBe(true);

    queue.setPlan(jobs('b', 'c'));
    expect(queue.isReady('a')).toBe(false);
    expect(queue.stats.evicted).toBe(1);
  });

  test('keeps cached segments that stay in the plan', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a', 'b'));
    await flush();
    await synth.finish('a');

    queue.setPlan(jobs('a', 'c'));
    expect(queue.isReady('a')).toBe(true);
    expect(queue.stats.evicted).toBe(0);
  });
});

describe('waitFor', () => {
  test('resolves when the segment becomes ready', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a'));
    const waiting = queue.waitFor('a');
    await flush();
    await synth.finish('a', 'AUDIO-A');

    await expect(waiting).resolves.toBe('AUDIO-A');
  });

  test('resolves immediately for an already-cached segment', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a'));
    await flush();
    await synth.finish('a', 'AUDIO-A');

    await expect(queue.waitFor('a')).resolves.toBe('AUDIO-A');
  });

  test('rejects when the segment is seeked away from, so the UI is not stuck spinning', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a'));
    const waiting = queue.waitFor('a');
    await flush();

    queue.setPlan(jobs('z'));

    await expect(waiting).rejects.toThrow(/left the buffer/);
  });

  test('rejects for a segment that is not planned at all', async () => {
    const queue = new SynthesisQueue({ synthesize: makeControllableSynth().synthesize });
    await expect(queue.waitFor('nope')).rejects.toThrow(/not in the buffer/);
  });
});

describe('failures', () => {
  test('a failed segment does not stall the queue', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    queue.setPlan(jobs('a', 'b'));
    await flush();
    await synth.fail('a');

    expect(queue.stats.failed).toBe(1);
    expect(synth.started).toEqual(['a', 'b']);
    console.warn.mockRestore();
  });

  test('a failed segment is not retried in a loop', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    queue.setPlan(jobs('a'));
    await flush();
    await synth.fail('a');
    await flush();

    expect(synth.synthesize).toHaveBeenCalledTimes(1);
    console.warn.mockRestore();
  });

  test('waitFor rejects on synthesis failure', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    queue.setPlan(jobs('a'));
    const waiting = queue.waitFor('a');
    await flush();
    await synth.fail('a', new Error('engine exploded'));

    await expect(waiting).rejects.toThrow('engine exploded');
    console.warn.mockRestore();
  });
});

describe('clear', () => {
  test('aborts in-flight work and empties the cache', async () => {
    const synth = makeControllableSynth();
    const queue = new SynthesisQueue({ synthesize: synth.synthesize });

    queue.setPlan(jobs('a', 'b'));
    await flush();
    queue.clear();

    expect(synth.aborted).toEqual(['a']);
    expect(queue.readyKeys()).toEqual([]);
  });
});
