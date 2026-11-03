import { splitOcrWord } from '@/src/plugins/read_along/plugin.read_along.js';

describe('splitOcrWord', () => {
  const box = { l: 100, r: 320, b: 50, t: 30 };

  test('leaves a single word alone', () => {
    expect(splitOcrWord(' disappeared, ', box)).toEqual([{ text: 'disappeared,', box }]);
  });

  test('splits words sharing one box, dividing it by length', () => {
    const [first, second] = splitOcrWord('straightway disappeared,', box);
    // 11 and 12 characters
    const split = 100 + 220 * 11 / 23;
    expect(first.text).toBe('straightway');
    expect(second.text).toBe('disappeared,');
    expect(first.box).toEqual({ l: 100, r: split, b: 50, t: 30 });
    expect(second.box.l).toBeCloseTo(split);
    expect(second.box.r).toBeCloseTo(320);
  });
});
