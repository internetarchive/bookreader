import {
  normalizeOcrText,
  splitSentences,
  segmentParagraph,
  LANDMARK_WORD_COUNT,
} from '@/src/audioreader/textSegments.js';

describe('normalizeOcrText', () => {
  test('collapses the multi-space runs djvu OCR produces', () => {
    expect(normalizeOcrText('nave  fallen  into  the  same  error'))
      .toBe('nave fallen into the same error');
  });

  test('trims and handles empty input', () => {
    expect(normalizeOcrText('  hi  ')).toBe('hi');
    expect(normalizeOcrText('')).toBe('');
    expect(normalizeOcrText(undefined)).toBe('');
  });
});

describe('splitSentences', () => {
  test('splits on sentence terminators', () => {
    expect(splitSentences('One thing here. Two things there! Three? Yes.'))
      .toEqual(['One thing here.', 'Two things there!', 'Three?', 'Yes.']);
  });

  test('does not split on abbreviations', () => {
    expect(splitSentences('Mr. Holmes went out. He returned.'))
      .toEqual(['Mr. Holmes went out.', 'He returned.']);
  });

  test('does not split on initials', () => {
    expect(splitSentences('J. R. Smith arrived late. Nobody minded.'))
      .toEqual(['J. R. Smith arrived late.', 'Nobody minded.']);
  });

  test('does not split inside decimal numbers', () => {
    expect(splitSentences('It cost 3.50 in total. That was cheap.'))
      .toEqual(['It cost 3.50 in total.', 'That was cheap.']);
  });

  test('keeps a closing quote with its sentence', () => {
    expect(splitSentences('"Stop!" she said. He stopped.'))
      .toEqual(['"Stop!" she said.', 'He stopped.']);
  });

  test('returns an unterminated tail as its own sentence', () => {
    expect(splitSentences('A finished one. An unfinished one'))
      .toEqual(['A finished one.', 'An unfinished one']);
  });

  test('returns [] for whitespace-only text', () => {
    expect(splitSentences('   ')).toEqual([]);
  });
});

describe('segmentParagraph', () => {
  const PARAGRAPH = 'The first sentence of this paragraph runs long. A second sentence follows. And a third.';

  test('emits landmark, sentence tail, then one segment per remaining sentence', () => {
    const segments = segmentParagraph(PARAGRAPH);
    expect(segments.map(s => s.kind))
      .toEqual(['landmark', 'sentence-tail', 'sentence', 'sentence']);
  });

  test('the landmark is exactly the first 3 words', () => {
    const [landmark] = segmentParagraph(PARAGRAPH);
    expect(landmark.text).toBe('The first sentence');
    expect(landmark.text.split(' ')).toHaveLength(LANDMARK_WORD_COUNT);
  });

  test('the sentence tail is the rest of the first sentence only', () => {
    const [, tail] = segmentParagraph(PARAGRAPH);
    expect(tail.text).toBe('of this paragraph runs long.');
  });

  test('segments concatenate back to the original paragraph', () => {
    const segments = segmentParagraph(PARAGRAPH);
    expect(segments.map(s => s.text).join(' ')).toBe(PARAGRAPH);
  });

  test('charOffset points at the segment text within the paragraph', () => {
    const segments = segmentParagraph(PARAGRAPH);
    for (const segment of segments) {
      expect(PARAGRAPH.slice(segment.charOffset, segment.charOffset + segment.text.length))
        .toBe(segment.text);
    }
  });

  test('charOffsets are strictly increasing even when words repeat', () => {
    // "the" appears in every sentence; a naive indexOf would rewind.
    const segments = segmentParagraph('Take the thing. Take the thing. Take the thing.');
    const offsets = segments.map(s => s.charOffset);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    expect(new Set(offsets).size).toBe(offsets.length);
  });

  test('does not split a first sentence shorter than the landmark', () => {
    const segments = segmentParagraph('Yes it is. Then more text follows here.');
    expect(segments.map(s => s.text)).toEqual(['Yes it is.', 'Then more text follows here.']);
    expect(segments[0].kind).toBe('landmark');
  });

  test('honors a custom landmark size', () => {
    const [landmark] = segmentParagraph(PARAGRAPH, { landmarkWords: 5 });
    expect(landmark.text).toBe('The first sentence of this');
  });

  test('returns [] for an empty paragraph', () => {
    expect(segmentParagraph('')).toEqual([]);
    expect(segmentParagraph('   ')).toEqual([]);
  });

  test('indexes are sequential from 0', () => {
    const segments = segmentParagraph(PARAGRAPH);
    expect(segments.map(s => s.index)).toEqual([0, 1, 2, 3]);
  });
});
