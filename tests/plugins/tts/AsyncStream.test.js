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

    /**
     * This function is awkward; because resolving a promise doesn't
     * _guarantee_ that its callbacks will be called immediately, I need
     * the code that checks things ran in the right order to be executed
     * after all those callbacks have happened. I'm using an array to store
     * 'events' as they "truly" happened, and then checking the order at 
     * the end.
     */
    test('Does not pull twice if a pull is still in progress', () => {

        /** @type {String[]} keeps track of the order events happen in (so we can check that order) */
        const events = [];

        // waiting '0' seconds essentially lets us run at the end of the event
        // loop (i.e. after any promises which aren't _actually_ async have finished)
        const wait0 = () => new Promise(res => setTimeout(res));

        /**
         * Creates a promise we can resolve at a specific time
         * @template T
         * @param {T} value 
         * @return {Promise<T> & { resolve: Function }}
         */
        function makeConfederatePromise(value) {
            let resolver = null;
            const promise = new Promise(res => resolver = res);
            promise.resolve = () => {
                events.push(`parent.pull resolved ${value}`);
                resolver({ value, done: !Boolean(value)});
            };
            return promise;
        }
        
        const fakePromises = [
            makeConfederatePromise([1, 10]),
            makeConfederatePromise([2, 20]),
            makeConfederatePromise(null),
        ];
        
        let fakePromisesIndex = 0;
        const parentStream = AsyncStream.range(1, 2);
        parentStream.pull = () => {
            events.push('parent.pull');
            return fakePromises[fakePromisesIndex++];
        };
        
        const s = parentStream.flatten();
        for (let i = 0; i < 5; i++) {
            s.pull().then(x => events.push(`recieved ${x.value}`));
        }

        fakePromises[0].resolve();
        // return the final promise; that way jest waits for it to complete
        // before exiting the test
        return wait0()
        .then(() => {
            expect(events).toEqual([
                'parent.pull',
                'parent.pull resolved 1,10',
                'recieved 1',
                'recieved 10',
                'parent.pull',
            ]);
            events.length = 0;
            fakePromises[1].resolve();
            return wait0();
        })
        .then(() => {
            expect(events).toEqual([
                'parent.pull resolved 2,20',
                'recieved 2',
                'recieved 20',
                'parent.pull',
            ]);
            events.length = 0;
            fakePromises[2].resolve();
            return wait0();
        })
        .then(() => {
            expect(events).toEqual([
                'parent.pull resolved null',
                'recieved null',
            ]);
        });
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