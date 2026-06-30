// @ts-check

/**
 * @template T
 * Get the i-th element of an iterable
 * @param {Iterable<T>} iterable
 * @param {number} index
 */
export function genAt(iterable, index) {
  let i = 0;
  for (const x of iterable) {
    if (i == index) return x;
    i++;
  }
  return undefined;
}

/**
 * @template T
 * Generator version of filter
 * @param {Iterable<T>} iterable
 * @param {function(T): boolean} fn
 */
export function* genFilter(iterable, fn) {
  for (const x of iterable) {
    if (fn(x)) yield x;
  }
}

/**
 * @template TFrom, TTo
 * Generator version of map
 * @param {Iterable<TFrom>} gen
 * @param {function(TFrom): TTo} fn
 * @returns {Iterable<TTo>}
 */
export function* genMap(gen, fn) {
  for (const x of gen) yield fn(x);
}

/**
 * @template T
 * Generator that provides a sliding window of 3 elements,
 * prev, current, and next.
 * @param {Iterable<T>} gen
 * @returns {Iterable<[T | undefined, T, T | undefined]>}
 */
export function* lookAroundWindow(gen) {
  let prev = undefined;
  let cur = undefined;
  let next = undefined;
  for (const x of gen) {
    if (typeof cur !== 'undefined') {
      next = x;
      yield [prev, cur, next];
    }
    prev = cur;
    cur = x;
    next = undefined;
  }

  if (typeof cur !== 'undefined') {
    yield [prev, cur, next];
  }
}

/**
 * @template T1, T2
 * Lazy zip implementation to avoid importing lodash
 * Expects iterators to be of the same length
 * @param {Iterable<T1>} gen1
 * @param {Iterable<T2>} gen2
 * @returns {Iterable<[T1, T2]>}
 */
export function* zip(gen1, gen2) {
  const it1 = gen1[Symbol.iterator]();
  const it2 = gen2[Symbol.iterator]();
  while (true) {
    const r1 = it1.next();
    const r2 = it2.next();
    if (r1.done && r2.done) {
      return;
    }
    if (r1.done || r2.done) {
      throw new Error('zip: one of the iterators is done');
    }
    yield [r1.value, r2.value];
  }
}
