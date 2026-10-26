import { Rect } from '@/src/util/rect.js';

describe('Rect', () => {
  test('exposes each edge', () => {
    const rect = new Rect(10, 30, 15, 10);
    expect([rect.left, rect.top, rect.right, rect.bottom]).toEqual([10, 30, 25, 40]);
  });

  test('fromEdges()', () => {
    expect(Rect.fromEdges(10, 30, 25, 40)).toEqual(new Rect(10, 30, 15, 10));
  });

  test('bounding() covers all the given rects', () => {
    const rect = Rect.bounding([Rect.fromEdges(10, 30, 20, 40), Rect.fromEdges(5, 50, 30, 60)]);
    expect(rect).toEqual(Rect.fromEdges(5, 30, 30, 60));
  });

  test('bounding() of nothing is null', () => {
    expect(Rect.bounding([])).toBeNull();
  });
});
