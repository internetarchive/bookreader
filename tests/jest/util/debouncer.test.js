import sinon from 'sinon';
import { BatchFetcher, OpenPromise } from '@/src/util/debouncer.js';

/** Resolves each requested input to `"v{input}"` , recording the batches it was called with */
function recordingFetchMany() {
  /** @type {number[][]} */
  const calls = [];
  const fetchMany = (inputs) => {
    calls.push(inputs);
    return Promise.resolve(Object.fromEntries(inputs.map(i => [i, `v${i}`])));
  };
  fetchMany.calls = calls;
  return fetchMany;
}

describe("OpenPromise", () => {
  test('Exposes resolve', async () => {
    const op = new OpenPromise();
    op.resolve(3);
    await expect(op.promise).resolves.toBe(3);
  });

  test('Exposes reject', async () => {
    const op = new OpenPromise();
    op.reject(new Error('nope'));
    await expect(op.promise).rejects.toThrow('nope');
  });
});

describe("BatchFetcher", () => {
  /** @type {sinon.SinonFakeTimers} */
  let clock;
  beforeEach(() => clock = sinon.useFakeTimers());
  afterEach(() => clock.restore());

  test('Groups calls made within the time window into one batch', async () => {
    const fetchMany = recordingFetchMany();
    const bf = new BatchFetcher(fetchMany, { batchSize: 5, timeWindow: 250 });

    const promises = [bf.fetchOne(1), bf.fetchOne(2), bf.fetchOne(3)];
    expect(fetchMany.calls).toHaveLength(0);

    await clock.tickAsync(250);
    expect(fetchMany.calls).toEqual([[1, 2, 3]]);
    await expect(Promise.all(promises)).resolves.toEqual(['v1', 'v2', 'v3']);
  });

  test('Dispatches immediately once batchSize is reached', async () => {
    const fetchMany = recordingFetchMany();
    const bf = new BatchFetcher(fetchMany, { batchSize: 2, timeWindow: 250 });

    bf.fetchOne(1);
    expect(fetchMany.calls).toHaveLength(0);
    bf.fetchOne(2);
    expect(fetchMany.calls).toEqual([[1, 2]]);
  });

  test('Splits into multiple batches once over batchSize', async () => {
    const fetchMany = recordingFetchMany();
    const bf = new BatchFetcher(fetchMany, { batchSize: 2, timeWindow: 250 });

    const promises = [1, 2, 3].map(i => bf.fetchOne(i));
    await clock.tickAsync(250);

    expect(fetchMany.calls).toEqual([[1, 2], [3]]);
    await expect(Promise.all(promises)).resolves.toEqual(['v1', 'v2', 'v3']);
  });

  test('Batched inputs are sorted numerically', async () => {
    const fetchMany = recordingFetchMany();
    const bf = new BatchFetcher(fetchMany, { batchSize: 5, timeWindow: 250 });

    [10, 2, 33, 4].forEach(i => bf.fetchOne(i));
    await clock.tickAsync(250);

    expect(fetchMany.calls).toEqual([[2, 4, 10, 33]]);
  });

  test('Requesting the same input twice only fetches it once', async () => {
    const fetchMany = recordingFetchMany();
    const bf = new BatchFetcher(fetchMany, { batchSize: 5, timeWindow: 250 });

    const p1 = bf.fetchOne(7);
    const p2 = bf.fetchOne(7);
    await clock.tickAsync(250);

    expect(fetchMany.calls).toEqual([[7]]);
    // ...but both callers still get their value
    await expect(Promise.all([p1, p2])).resolves.toEqual(['v7', 'v7']);
  });

  test('Cached inputs resolve without any fetch', async () => {
    const fetchMany = recordingFetchMany();
    const bf = new BatchFetcher(fetchMany, {
      batchSize: 5, timeWindow: 250,
      getFromCache: (i) => i === 1 ? 'cached1' : undefined,
    });

    await expect(bf.fetchOne(1)).resolves.toBe('cached1');
    await clock.tickAsync(250);
    expect(fetchMany.calls).toHaveLength(0);
  });

  test('Only uncached inputs are fetched', async () => {
    const fetchMany = recordingFetchMany();
    const bf = new BatchFetcher(fetchMany, {
      batchSize: 5, timeWindow: 250,
      getFromCache: (i) => i === 1 ? 'cached1' : undefined,
    });

    const promises = [bf.fetchOne(1), bf.fetchOne(2)];
    await clock.tickAsync(250);

    expect(fetchMany.calls).toEqual([[2]]);
    await expect(Promise.all(promises)).resolves.toEqual(['cached1', 'v2']);
  });

  test('A failing fetch rejects every caller in the batch', async () => {
    const bf = new BatchFetcher(
      () => Promise.reject(new Error('network down')),
      { batchSize: 5, timeWindow: 250 },
    );

    const promises = [bf.fetchOne(1), bf.fetchOne(2)];
    // Attach handlers before ticking, so the rejections are never unhandled
    const settled = Promise.allSettled(promises);
    await clock.tickAsync(250);

    expect((await settled).map(r => r.status)).toEqual(['rejected', 'rejected']);
    await expect(promises[0]).rejects.toThrow('network down');
  });

  test('A failed batch does not block later batches', async () => {
    let shouldFail = true;
    const bf = new BatchFetcher(
      (inputs) => shouldFail
        ? Promise.reject(new Error('network down'))
        : Promise.resolve(Object.fromEntries(inputs.map(i => [i, `v${i}`]))),
      { batchSize: 5, timeWindow: 250 },
    );

    const failing = bf.fetchOne(1).catch(e => e.message);
    await clock.tickAsync(250);
    expect(await failing).toBe('network down');

    shouldFail = false;
    const succeeding = bf.fetchOne(2);
    await clock.tickAsync(250);
    await expect(succeeding).resolves.toBe('v2');
  });

  test('Queue and batch are emptied once a batch settles', async () => {
    const fetchMany = recordingFetchMany();
    const bf = new BatchFetcher(fetchMany, { batchSize: 5, timeWindow: 250 });

    bf.fetchOne(1);
    bf.fetchOne(2);
    await clock.tickAsync(250);

    expect(bf.batch).toEqual([]);
    expect(bf.queue).toEqual([]);
    expect(bf.timeout).toBeNull();
  });
});
