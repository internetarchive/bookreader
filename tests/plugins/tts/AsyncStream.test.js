import AsyncStream from '../../../src/js/plugins/tts/AsyncStream.js';

describe('RangeAsyncStream', () => {
    test('Returns numbers in range', () => {
        const s = AsyncStream.range(1, 3);
        expect(s.pull()).resolves.toEqual({ value: 1, done: false });
        expect(s.pull()).resolves.toEqual({ value: 2, done: false });
        expect(s.pull()).resolves.toEqual({ value: 3, done: false });
        expect(s.pull()).resolves.toEqual({ value: null, done: true });
    });

    test('Going over does not error', () => {
        const s = AsyncStream.range(1, 1);
        expect(s.pull()).resolves.toEqual({ value: 1, done: false });
        expect(s.pull()).resolves.toEqual({ value: null, done: true });
        expect(s.pull()).resolves.toEqual({ value: null, done: true });
        expect(s.pull()).resolves.toEqual({ value: null, done: true });
    });
});

describe('MappingAsyncStream', () => {
    test('Sync mapper', () => {
        const s = AsyncStream.range(1, 2).map(x => x*10);
        expect(s.pull()).resolves.toEqual({ value: 10, done: false });
        expect(s.pull()).resolves.toEqual({ value: 20, done: false });
        expect(s.pull()).resolves.toEqual({ value: null, done: true });
    });

    test('Async mapper', () => {
        const s = AsyncStream.range(1, 2).map(x => Promise.resolve(x*10));
        expect(s.pull()).resolves.toEqual({ value: 10, done: false });
        expect(s.pull()).resolves.toEqual({ value: 20, done: false });
        expect(s.pull()).resolves.toEqual({ value: null, done: true });
    });

    test('Going over does not error', () => {
        const s = AsyncStream.range(1, 1).map(x => x*10);
        expect(s.pull()).resolves.toEqual({ value: 10, done: false });
        expect(s.pull()).resolves.toEqual({ value: null, done: true });
        expect(s.pull()).resolves.toEqual({ value: null, done: true });
        expect(s.pull()).resolves.toEqual({ value: null, done: true });
    });
});

describe('FlatteningAsyncStream', () => {
    test('Expands an array', () => {
        const s = AsyncStream.range(1, 2)
        .map(x => [x, x*10, x*100])
        .flatten();
        expect(s.pull()).resolves.toEqual({ value: 1, done: false });
        expect(s.pull()).resolves.toEqual({ value: 10, done: false });
        expect(s.pull()).resolves.toEqual({ value: 100, done: false });
        expect(s.pull()).resolves.toEqual({ value: 2, done: false });
        expect(s.pull()).resolves.toEqual({ value: 20, done: false });
        expect(s.pull()).resolves.toEqual({ value: 200, done: false });
        expect(s.pull()).resolves.toEqual({ value: null, done: true });
    });
});

describe('BufferingAsyncStream', () => {
    test('Does not buffer before pull', () => {
        const s = AsyncStream.range(1, 10).buffer(10);
        expect(s._promiseBuffer.length).toBe(0);
    });

    test('Yields results in order', () => {
        const s = AsyncStream.range(1, 3).buffer(10);
        expect(s.pull()).resolves.toEqual({ value: 1, done: false });
        expect(s.pull()).resolves.toEqual({ value: 2, done: false });
        expect(s.pull()).resolves.toEqual({ value: 3, done: false });
        expect(s.pull()).resolves.toEqual({ value: null, done: true });
    });

    test('Buffer always contains bufferSize elements', () => {
        const s = AsyncStream.range(1, 100).buffer(10);
        s.pull();
        expect(s._promiseBuffer.length).toBe(10);
        s.pull();
        expect(s._promiseBuffer.length).toBe(10);
    });
});