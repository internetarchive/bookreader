import { ReadAlongAligner, normalizeWord, tokenize, wordScore } from '@/src/plugins/read_along/aligner.js';

const PAGE = tokenize(`
  To Sherlock Holmes she is always the woman. I have seldom heard him mention
  her under any other name. In his eyes she eclipses and predominates the whole
  of her sex. It was not that he felt any emotion akin to love for Irene Adler.
  All emotions, and that one particularly, were abhorrent to his cold, precise
  but admirably balanced mind.
`);

/** @param {ReadAlongAligner} aligner */
const wordAt = aligner => aligner.words[aligner.pos];

describe('normalizeWord', () => {
  test('strips punctuation, case and diacritics', () => {
    expect(normalizeWord('To-day,')).toBe('today');
    expect(normalizeWord('Café')).toBe('cafe');
    expect(normalizeWord('—')).toBe('');
  });
});

describe('wordScore', () => {
  test('tolerates OCR typos', () => {
    expect(wordScore('holmes', 'hoimes')).toBeGreaterThan(0);
  });
  test('short words must match exactly', () => {
    expect(wordScore('in', 'is')).toBeLessThan(0);
  });
  test('partial interim words match by prefix', () => {
    expect(wordScore('predom', 'predominates', true)).toBeGreaterThan(0);
    expect(wordScore('predom', 'predominates', false)).toBeLessThan(0);
  });
});

describe('ReadAlongAligner', () => {
  test('finds the position from scratch', () => {
    const aligner = new ReadAlongAligner(PAGE);
    aligner.update(tokenize('in his eyes she eclipses'));
    expect(wordAt(aligner)).toBe('eclipses');
  });

  test('does not lock on from too few words', () => {
    const aligner = new ReadAlongAligner(PAGE);
    expect(aligner.update(tokenize('her'))).toBeNull();
    expect(aligner.pos).toBe(-1);
  });

  test('follows reading word by word, despite recognition errors', () => {
    const aligner = new ReadAlongAligner(PAGE);
    let heard = 'to sherlock holmes she is';
    aligner.update(tokenize(heard));
    expect(wordAt(aligner)).toBe('is');
    for (const [word, expected] of [['always', 'always'], ['the', 'the'], ['women', 'woman'], ['eye', 'woman'], ['have', 'have'], ['seldom', 'seldom']]) {
      heard += ` ${word}`;
      aligner.update(tokenize(heard));
      expect(wordAt(aligner)).toBe(expected);
    }
  });

  test('ambiguous common words resolve to the nearest forward occurrence', () => {
    const aligner = new ReadAlongAligner(PAGE);
    aligner.update(tokenize('i have seldom heard him mention her under any other name'));
    aligner.update(tokenize('i have seldom heard him mention her under any other name in his eyes she eclipses and predominates the whole of her'));
    expect(aligner.pos).toBe(PAGE.indexOf('sex') - 1);
  });

  test('follows the reader going back a bit', () => {
    const aligner = new ReadAlongAligner(PAGE);
    aligner.update(tokenize('it was not that he felt any emotion akin to love'));
    expect(wordAt(aligner)).toBe('love');
    aligner.update(tokenize('it was not that he felt any emotion akin to love in his eyes she eclipses'));
    expect(wordAt(aligner)).toBe('eclipses');
  });

  test('ignores a stray word far away', () => {
    const aligner = new ReadAlongAligner(PAGE);
    aligner.update(tokenize('to sherlock holmes she is always'));
    aligner.update(tokenize('to sherlock holmes she is always adler'));
    expect(wordAt(aligner)).toBe('always');
  });
});
