import { tokenize } from '@/src/plugins/read_along/aligner.js';
import { resolveCues, resolveQuote } from '@/src/plugins/read_along/soundscape.js';

const PAGE = tokenize(`
  Goody Two Shoes cuddled down in the soft hay, glad of a chance to rest her
  weary limbs, and quite out of breath with her long run and just then down
  rattled the rain, the thunder roared, the lightning flashed, and the old barn
  trembled, and so did Goody Two Shoes.
`);

describe('resolveQuote', () => {
  test('anchors to the start or end of the quote', () => {
    expect(PAGE[resolveQuote(PAGE, 'down rattled the rain')]).toBe('down');
    expect(PAGE[resolveQuote(PAGE, 'down rattled the rain', 'end')]).toBe('rain');
  });

  test('ignores case and punctuation', () => {
    expect(PAGE[resolveQuote(PAGE, 'The Thunder Roared!', 'end')]).toBe('roared');
  });

  test('tolerates OCR errors in a long enough quote', () => {
    const ocr = PAGE.map(w => w == 'rattled' ? 'rattlcd' : w);
    expect(ocr[resolveQuote(ocr, 'and just then down rattled the rain', 'end')]).toBe('rain');
  });

  test('returns -1 when not found', () => {
    expect(resolveQuote(PAGE, 'the cat sat on the mat')).toBe(-1);
  });
});

describe('resolveCues', () => {
  test('resolves cues on loaded pages only, in reading order', () => {
    const spec = {
      version: 1,
      sounds: {},
      cues: [
        { at: { pageIndex: 6, quote: 'thunder roared' }, actions: [] },
        { at: { pageIndex: 6, quote: 'down rattled the rain', position: 'end' }, actions: [] },
        { at: { pageIndex: 9, quote: 'anything' }, actions: [] },
      ],
    };
    const cues = resolveCues(spec, new Map([[6, PAGE]]));
    expect(cues.map(c => PAGE[c.wordIndex])).toEqual(['rain', 'thunder']);
  });
});
