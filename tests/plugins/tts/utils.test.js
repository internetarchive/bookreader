import * as utils from '../../../src/js/plugins/tts/utils.js';

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
});
