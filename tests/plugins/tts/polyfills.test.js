import * as polyfills from '../../../src/js/plugins/tts/polyfills';

describe('Array.prototype.find', () => {
    test('empty array', () => {
        expect(polyfills.find.call([], x => true)).toBe(undefined);
        expect(polyfills.find.call([], x => false)).toBe(undefined);
    });

    test('basic array', () => {
        expect(polyfills.find.call([1,2,3], x => x == 2)).toBe(2);
        expect(polyfills.find.call([1,2,3], x => x%2 == 1)).toBe(1);
        expect(polyfills.find.call([1,2,3], x => false)).toBe(undefined);
    });

    test('array of objects', () => {
        const result = {x: 7};
        expect(polyfills.find.call([result, {x: 8}], x => x.x == 7)).toBe(result);
    });

    test('iterable object', () => {
        expect(polyfills.find.call({0: 1, 1: 1, 2: 2, length: 3}, x => x == 1)).toBe(1);
    });
});
