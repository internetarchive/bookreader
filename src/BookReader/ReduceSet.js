/**
 * @typedef {object} ReduceSet Set of valid numbers for a reduce variable.
 * @property {(n: number) => number} floor
 * @property {(n: number) => number} decr Return the predecessor of the given element
 */

/** @type {ReduceSet} */
export const IntegerReduceSet = {
  floor: Math.floor,
  decr(n) { return n - 1; },
};

/** @type {ReduceSet} */
export const Pow2ReduceSet = {
  floor(n) {
    return 2 ** (Math.floor(Math.log2(Math.max(1, n))));
  },
  decr(n) {
    return 2 ** (Math.log2(n) - 1);
  },
};

export const NAMED_REDUCE_SETS = {
  pow2: Pow2ReduceSet,
  integer: IntegerReduceSet,
};
