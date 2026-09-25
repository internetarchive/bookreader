// @ts-check
/**
 * Wait until some time has passed before executing a callback.
 *
 * @param {Function} callback
 * @param {Number}   threshhold - in milliseconds
 * @param {*}        context    - will be bound to callback as its "this" value
 */
export class Debouncer {
  constructor(callback, threshhold = 250, context = undefined) {
    this.callback = callback;
    this.threshhold = threshhold;
    this.context = context;
    this.deferTimeout = undefined;
  }

  execute() {
    clearTimeout(this.deferTimeout);
    this.deferTimeout = setTimeout(this.executeCallback.bind(this), this.threshhold);
  }

  executeCallback() {
    this.callback.apply(this.context);
  }
}

/**
 * @template T
 */
export class OpenPromise {
  /** @type {Promise<T>} */
  promise;

  /** @type {(value: T) => void} */
  resolve;

  /** @type {(reason: any) => void} */
  reject;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

/**
 * Wraps a function that fetches many inputs at once, exposing a `fetchOne` that takes a
 * single input. Calls to `fetchOne` are grouped into batches, so that fetching e.g. each
 * page of a spread separately still results in one request.
 *
 * A batch is dispatched once it reaches `batchSize`, or once `timeWindow` ms have passed
 * since the batch was started, whichever comes first.
 *
 * @template {number} TInput
 * @template TOutput
 */
export class BatchFetcher {
  /**
   * @param {function(TInput[]): Promise<Record<TInput, TOutput>>} fetchMany
   * @param {object} options
   * @param {number} [options.batchSize] How many items at a time should be fetched
   * @param {number} [options.timeWindow] How many ms to wait to group requests
   * @param {function(TInput): TOutput | null} [options.getFromCache] If there is a cache,
   * can use this to return a value immediately and avoid unnecessary requests
   */

  constructor(fetchMany, { batchSize = 5, timeWindow = 250, getFromCache = null } = {}) {
    /** @type {function(TInput[]): Promise<Record<TInput, TOutput>>} */
    this.fetchMany = fetchMany;
    /** @type {number} */
    this.batchSize = batchSize;
    /** @type {number} */
    this.timeWindow = timeWindow;
    /** @type {function(TInput): TOutput | null} */
    this.getFromCache = getFromCache;
    /** @type {{ input: TInput, promise: OpenPromise<TOutput> }[]} */
    this.queue = [];
    /** @type {TInput[]} */
    this.batch = [];

    this.timeout = null;
  }

  /**
   * @private
   * Empties out the batch and does the fetch
   */
  drainBatch = () => {
    clearTimeout(this.timeout);
    this.timeout = null;

    // sort numerically
    const toFetch = Array.from(this.batch.sort((a, b) => a - b));
    this.batch.length = 0;
    this.fetchMany(toFetch)
      .then((results) => {
        /** @type {{ input: TInput, promise: OpenPromise<TOutput> }[]} */
        const handled = this.queue.filter(x => toFetch.includes(x.input));
        this.queue = this.queue.filter(x => !handled.includes(x));
        handled.forEach(req => req.promise.resolve(results[req.input]));
      })
      .catch((e) => {
        /** @type {{ input: TInput, promise: OpenPromise<TOutput> }[]} */
        const handled = this.queue.filter(x => toFetch.includes(x.input));
        this.queue = this.queue.filter(x => !handled.includes(x));
        handled.forEach(req => req.promise.reject(e));
      });
  }

  /**
   * @param {TInput} input
   * @returns {Promise<TOutput>}
   */
  fetchOne = (input) => {

    // FIXME: Not sure if undefined might be a valid value
    const cachedValue = this.getFromCache?.(input);
    if (typeof cachedValue !== 'undefined') {
      return Promise.resolve(cachedValue);
    }

    const request = {
      input,
      /** @type {OpenPromise<TOutput>} */
      promise: new OpenPromise(),
    };
    this.queue.push(request);

    if (this.batch.includes(input)) {
      return request.promise.promise;
    } else {
      this.batch.push(input);
    }

    if (this.batch.length >= this.batchSize) {
      this.drainBatch();
    } else {
      if (!this.timeout) {
        this.timeout = setTimeout(() => {
          this.drainBatch();
        }, this.timeWindow);
      }
    }

    return request.promise.promise;
  }
}
