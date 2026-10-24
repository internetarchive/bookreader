import { AudioReaderView } from '@/src/audioreader/AudioReaderView.js';

/**
 * Build a bare view with just enough of a book and player for the page-bar math.
 * The view is never rendered -- these tests exercise the click-to-page mapping
 * that the pointer handler delegates to, which needs no layout.
 */
function makeView(numLeafs) {
  const view = new AudioReaderView();
  view.book = { numLeafs, identifier: 'test-book', coverUrl: '', title: 'Test' };
  view.player = { jumpToLeaf: jest.fn().mockResolvedValue(undefined) };
  return view;
}

describe('clicking the page bar jumps to that page', () => {
  test('maps a position along the bar to the matching page', () => {
    const view = makeView(10);                 // leaves 0..9

    view._seekPageToFraction(0);
    view._seekPageToFraction(0.5);
    view._seekPageToFraction(1);

    const jumped = view.player.jumpToLeaf.mock.calls.map(([leaf]) => leaf);
    expect(jumped).toEqual([0, 5, 9]);          // round(f * (numLeafs - 1))
  });

  test('rounds to the nearest page', () => {
    const view = makeView(100);

    view._seekPageToFraction(0.333);            // 0.333 * 99 = 32.967 -> 33
    view._seekPageToFraction(0.334);            // 0.334 * 99 = 33.066 -> 33

    expect(view.player.jumpToLeaf.mock.calls.map(([l]) => l)).toEqual([33, 33]);
  });

  test('clamps positions past either end of the bar', () => {
    const view = makeView(10);

    view._seekPageToFraction(-0.4);
    view._seekPageToFraction(1.7);

    expect(view.player.jumpToLeaf.mock.calls.map(([l]) => l)).toEqual([0, 9]);
  });

  test('hands back the jump promise so the caller can await it', () => {
    const view = makeView(10);
    expect(view._seekPageToFraction(0.5)).toBeInstanceOf(Promise);
  });
});
