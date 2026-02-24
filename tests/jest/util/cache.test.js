import { Cache } from '@/src/util/cache.js';

describe("Cache", () => {
  test('Adding works', () => {
    const c = new Cache(10);
    c.add(35);
    expect(c.entries).toEqual([35]);
  });

  test('Size does not grow beyond limit', () => {
    const c = new Cache(2);
    c.add(35);
    c.add(32);
    c.add(12);
    c.add(11);
    c.add(112);
    expect(c.entries).toHaveLength(2);
  });

  test('Oldest evicted first', () => {
    const c = new Cache(2);
    c.add(35);
    c.add(32);
    c.add(12);
    c.add(12);
    c.add(10);
    expect(c.entries).toEqual([12, 10]);
  });
});
