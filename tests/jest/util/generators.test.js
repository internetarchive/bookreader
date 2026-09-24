import { genAt, genFilter, genMap, lookAroundWindow, zip } from '@/src/util/generators.js';

describe('genAt', () => {
  test('handles empty', () => {
    expect(genAt(genRange(-1), 0)).toBeUndefined();
  });

  test('handles non-empty', () => {
    expect(genAt(genRange(3), 0)).toBe(0);
    expect(genAt(genRange(3), 1)).toBe(1);
    expect(genAt(genRange(3), 2)).toBe(2);
  });

  test('handles out of bounds', () => {
    expect(genAt(genRange(3), 4)).toBeUndefined();
    expect(genAt(genRange(3), -1)).toBeUndefined();
  });
});

describe('genFilter', () => {
  test('handles empty', () => {
    expect(Array.from(genFilter(genRange(0), x => x > 0))).toEqual([]);
  });

  test('handles non-empty', () => {
    expect(Array.from(genFilter(genRange(3), x => x > 1))).toEqual([2, 3]);
    expect(Array.from(genFilter(genRange(3), x => x < 1))).toEqual([0]);
  });

  test('handles all false', () => {
    expect(Array.from(genFilter(genRange(3), x => x > 3))).toEqual([]);
  });
});

describe('genMap', () => {
  test('handles empty', () => {
    expect(Array.from(genMap([], x => x ** 2))).toEqual([]);
  });

  test('handles non-empty', () => {
    expect(Array.from(genMap([1,2,3], x => x ** 2))).toEqual([1,4,9]);
  });
});

describe('lookAroundWindow', () => {
  test('handles empty', () => {
    expect(Array.from(lookAroundWindow([]))).toEqual([]);
  });

  test('handles smaller than window', () => {
    expect(Array.from(lookAroundWindow([1]))).toEqual([[undefined, 1, undefined]]);
    expect(Array.from(lookAroundWindow([1, 2]))).toEqual([[undefined, 1, 2], [1, 2, undefined]]);
    expect(Array.from(lookAroundWindow([1, 2, 3]))).toEqual([[undefined, 1, 2], [1, 2, 3], [2, 3, undefined]]);
  });

  test('handles larger than window', () => {
    expect(Array.from(lookAroundWindow([1, 2, 3, 4]))).toEqual([
      [undefined, 1, 2],
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, undefined],
    ]);
  });
});

describe('zip', () => {
  test('handles empty', () => {
    expect(Array.from(zip([], []))).toEqual([]);
  });

  test('uneven throws error', () => {
    expect(() => Array.from(zip([1], [2, 3]))).toThrow();
  });

  test('handles even', () => {
    expect(Array.from(zip([1, 2], [3, 4]))).toEqual([[1, 3], [2, 4]]);
  });
});

/**
 * @param {number} n
 */
function* genRange(n) {
  for (let i = 0; i <= n; i++) {
    yield i;
  }
}
