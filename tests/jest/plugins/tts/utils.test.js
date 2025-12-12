import * as utils from '@/src/plugins/tts/utils.js';

describe('approximateWordCount', () => {
  const { approximateWordCount } = utils;

  test('Empties', () => {
    expect(approximateWordCount('')).toBe(0);
    expect(approximateWordCount('    ')).toBe(0);
  });

  test('Spaceless', () => {
    expect(approximateWordCount('supercalifragilisticexpialidocious')).toBe(1);
  });

  test('Basic', () => {
    expect(approximateWordCount('the quick brown fox jumped over the lazy dog')).toBe(9);
    expect(approximateWordCount('to be or not to be that is the question')).toBe(10);
  });

  test('Spacing', () => {
    expect(approximateWordCount('   the     quick brown   fox jumped over the lazy dog ')).toBe(9);
  });

  test('Punctuation not separate word (unless separate)', () => {
    expect(approximateWordCount('the. quick brown. fox. jumped. over the. lazy dog.')).toBe(9);
    expect(approximateWordCount(' . . . . . ')).toBe(5);
  });

  test('Realword examples', () => {
    expect(approximateWordCount("Albert\u2019s cats had a .large blue dish of milk for breakfast.")).toBe(11);
    expect(approximateWordCount("FARM FOLK O nce upon a time there was a sturdy little boy who lived in Belgium. Every morning after he milked the cows, he gave his cats a large blue dish of milk for breakfast.")).toBe(36);
  });
});

describe('toISO6391', () => {
  const { toISO6391 } = utils;

  test('ISO 639-1', () => {
    expect(toISO6391('en')).toBe('en');
    expect(toISO6391('fr')).toBe('fr');
    expect(toISO6391('SQ')).toBe('sq');
    expect(toISO6391('aa')).toBe('aa');
  });

  test('ISO 639-2/T', () => {
    expect(toISO6391('amh')).toBe('am');
    expect(toISO6391('BIH')).toBe('bh');
  });

  test('ISO 639-2/B', () => {
    expect(toISO6391('BAQ')).toBe('eu');
    expect(toISO6391('chi')).toBe('zh');
  });

  test('Name', () => {
    expect(toISO6391('english')).toBe('en');
    expect(toISO6391('German')).toBe('de');
  });

  test('Endonym', () => {
    expect(toISO6391('français')).toBe('fr');
    expect(toISO6391('汉语')).toBe('zh');
  });

  test('Mismatch', () => {
    expect(toISO6391('Parseltongue')).toBe(null);
    expect(toISO6391('Pig Latin')).toBe(null);
  });

  test('Falsey inputs', () => {
    expect(toISO6391(null)).toBe(null);
    expect(toISO6391('')).toBe(null);
  });

});

describe('toNativeName', () => {
  const { toNativeName } = utils;

  test('ISO 639-1', () => {
    expect(toNativeName('en')).toBe('English');
    expect(toNativeName('sR')).toBe('српски језик');
    expect(toNativeName('Hi')).toBe('हिन्दी');
  });

  test('ISO 639-2/T', () => {
    expect(toNativeName('amh')).toBe('አማርኛ');
    expect(toNativeName('uKr')).toBe('Українська');
  });

  test('ISO 639-2/B', () => {
    expect(toNativeName('BAQ')).toBe('euskara');
    expect(toNativeName('chi')).toBe('中文 (Zhōngwén)');
  });

  test('Name', () => {
    expect(toNativeName('eNgLiSh')).toBe('English');
    expect(toNativeName('Nyanja')).toBe('chiCheŵa');
    expect(toNativeName('Flemish')).toBe('Nederlands');
  });

  test('Endonym', () => {
    expect(toNativeName('FrançaiS')).toBe('français');
    expect(toNativeName("lenga d'òc")).toBe('occitan');
    expect(toNativeName('český jazyk')).toBe('čeština');
  });

  test('Mismatch', () => {
    expect(toNativeName('Parseltongue')).toBe(null);
    expect(toNativeName('Pig Latin')).toBe(null);
  });

  test('Falsey inputs', () => {
    expect(toNativeName(null)).toBe(null);
    expect(toNativeName('')).toBe(null);
  });

  test('Special langs', () => {
    expect(toNativeName('zh-hans')).toBe('中文 (Zhōngwén)');
  });
});
