/**
 * A priority-ordered, single-worker synthesis queue with a result cache.
 *
 * Issue #1580 asks for three things this class provides:
 *
 * - **Ordered background loading.** Segments are synthesized strictly in priority
 *   order -- landmark, rest of sentence, rest of paragraph, then the lookahead
 *   paragraphs -- "as a callback, so they get loaded in order and don't overload
 *   the client cpu". Hence exactly one synthesis runs at a time.
 * - **A bounded buffer.** Only what is in the current plan is kept; everything else
 *   is evicted, so a long book does not accumulate audio forever.
 * - **Seek that clears in-flight work.** On a jump the caller installs a new plan;
 *   if the running job is no longer the most urgent thing, it is aborted rather
 *   than left to finish and delay the segment the patron is actually waiting for.
 *
 * The queue knows nothing about audio: `synthesize` returns whatever the engine
 * wants to cache (a WebSpeech utterance shim, decoded PCM from PocketTTS, ...).
 */

/**
 * @typedef {Object} SynthesisJob
 * @property {string} key stable, unique per segment
 * @property {string} text
 */

export default class SynthesisQueue {
  /**
   * @param {Object} opts
   * @param {(text: string, ctx: {signal: AbortSignal, job: SynthesisJob}) => Promise<any>} opts.synthesize
   * @param {() => void} [opts.onChange] fired when the set of ready segments changes
   */
  constructor({ synthesize, onChange }) {
    this._synthesize = synthesize;
    this._onChange = onChange || (() => {});

    /** @type {SynthesisJob[]} priority order; index 0 is most urgent */
    this._plan = [];
    /** @type {Map<string, any>} key -> synthesized result */
    this._cache = new Map();
    /** @type {Set<string>} keys whose synthesis threw; not retried while planned */
    this._failed = new Set();
    /** @type {{key: string, controller: AbortController}|null} */
    this._current = null;
    /** @type {Map<string, {promise: Promise<any>, resolve: Function, reject: Function}>} */
    this._waiters = new Map();
    this._pumping = false;

    /** Counters, for tests and the debug overlay. */
    this.stats = { synthesized: 0, aborted: 0, failed: 0, evicted: 0 };
  }

  /**
   * Replace the plan. Jobs already synthesized keep their cached result; jobs that
   * dropped out of the plan are evicted.
   * @param {SynthesisJob[]} jobs in priority order
   */
  setPlan(jobs) {
    this._plan = jobs.slice();
    const planned = new Set(jobs.map(job => job.key));

    for (const key of [...this._cache.keys()]) {
      if (!planned.has(key)) {
        this._cache.delete(key);
        this.stats.evicted++;
      }
    }
    for (const key of [...this._failed]) {
      if (!planned.has(key)) this._failed.delete(key);
    }
    // Anyone waiting on a segment we are no longer going to produce is released,
    // rather than left hanging until the page is closed.
    for (const key of [...this._waiters.keys()]) {
      if (!planned.has(key)) this._reject(key, new Error(`AudioReader: ${key} left the buffer`));
    }

    // Abort work that is no longer the most urgent thing to be doing.
    const nextKey = this._nextJob()?.key;
    if (this._current && this._current.key !== nextKey) {
      this._current.controller.abort();
      this.stats.aborted++;
    }

    this._pump();
  }

  /** @return {SynthesisJob|undefined} highest-priority job not cached or failed */
  _nextJob() {
    return this._plan.find(job => !this._cache.has(job.key) && !this._failed.has(job.key));
  }

  /**
   * @param {string} key
   * @return {boolean} whether the segment is synthesized and ready to play
   */
  isReady(key) {
    return this._cache.has(key);
  }

  /**
   * @param {string} key
   * @return {any} the cached result, or undefined
   */
  get(key) {
    return this._cache.get(key);
  }

  /** @return {string[]} planned keys that are ready, in plan order */
  readyKeys() {
    return this._plan.filter(job => this._cache.has(job.key)).map(job => job.key);
  }

  /**
   * Resolve once `key` has been synthesized. Rejects if the key leaves the plan
   * (the patron seeked away) or its synthesis failed.
   * @param {string} key
   * @return {Promise<any>}
   */
  waitFor(key) {
    if (this._cache.has(key)) return Promise.resolve(this._cache.get(key));
    if (this._failed.has(key)) return Promise.reject(new Error(`AudioReader: ${key} failed to synthesize`));
    if (!this._plan.some(job => job.key === key)) {
      return Promise.reject(new Error(`AudioReader: ${key} is not in the buffer`));
    }

    if (!this._waiters.has(key)) {
      let resolve, reject;
      const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
      // Nothing else attaches a handler if the caller only ever checks isReady(),
      // so keep an inert catch on the stored promise to avoid unhandled rejections.
      promise.catch(() => {});
      this._waiters.set(key, { promise, resolve, reject });
    }
    return this._waiters.get(key).promise;
  }

  /** Abort in-flight work and drop everything. */
  clear() {
    if (this._current) {
      this._current.controller.abort();
      this.stats.aborted++;
    }
    this._plan = [];
    for (const key of [...this._waiters.keys()]) {
      this._reject(key, new Error('AudioReader: buffer cleared'));
    }
    this._cache.clear();
    this._failed.clear();
  }

  /** @private */
  _resolve(key, value) {
    const waiter = this._waiters.get(key);
    if (!waiter) return;
    this._waiters.delete(key);
    waiter.resolve(value);
  }

  /** @private */
  _reject(key, error) {
    const waiter = this._waiters.get(key);
    if (!waiter) return;
    this._waiters.delete(key);
    waiter.reject(error);
  }

  /**
   * @private
   * Drain the plan one job at a time. Re-reads `_plan` on every iteration so a
   * `setPlan` that lands mid-synthesis takes effect on the very next job.
   */
  async _pump() {
    if (this._pumping) return;
    this._pumping = true;

    try {
      for (;;) {
        const job = this._nextJob();
        if (!job) break;

        const controller = new AbortController();
        this._current = { key: job.key, controller };

        let result;
        try {
          result = await this._synthesize(job.text, { signal: controller.signal, job });
        } catch (error) {
          this._current = null;
          if (controller.signal.aborted) continue;
          this._failed.add(job.key);
          this.stats.failed++;
          console.warn(`AudioReader: synthesis failed for ${job.key}`, error);
          this._reject(job.key, error);
          continue;
        }
        this._current = null;

        // Aborted mid-flight, or seeked away while we were working: discard.
        if (controller.signal.aborted || !this._plan.some(planned => planned.key === job.key)) {
          continue;
        }

        this._cache.set(job.key, result);
        this.stats.synthesized++;
        this._resolve(job.key, result);
        this._onChange();
      }
    } finally {
      this._pumping = false;
    }
  }
}
