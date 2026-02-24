import {IntegerReduceSet, Pow2ReduceSet} from '@/src/BookReader/ReduceSet.js';

describe('IntegerReduceSet', () => {
  test('floor', () => {
    const f = IntegerReduceSet.floor;
    expect(f(1)).toBe(1);
    expect(f(3)).toBe(3);
    expect(f(3.1)).toBe(3);
    expect(f(3.5)).toBe(3);
    expect(f(3.9)).toBe(3);
  });

  test('decr', () => {
    const f = IntegerReduceSet.decr;
    expect(f(1)).toBe(0);
    expect(f(3)).toBe(2);
    expect(f(0)).toBe(-1);
  });
});

describe('Pow2ReduceSet', () => {
  test('floor', () => {
    const f = Pow2ReduceSet.floor;
    expect(f(1)).toBe(1);
    expect(f(3)).toBe(2);
    expect(f(3.5)).toBe(2);
    expect(f(4.1)).toBe(4);
    expect(f(8)).toBe(8);
  });

  test('decr', () => {
    const f = Pow2ReduceSet.decr;
    expect(f(1)).toBe(0.5);
    expect(f(2)).toBe(1);
    expect(f(4)).toBe(2);
    expect(f(8)).toBe(4);
  });
});
