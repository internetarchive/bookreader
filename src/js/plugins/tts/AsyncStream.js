import 'es6-promise/auto';

/**
 * @export
 * The underlying object wrapped each stream's elements. (Based on
 * JavaScript Generators; see
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next )
 * @template T
 * @typedef {Object} TStreamItem
 * @property {T} value
 * @property {Boolean} done
 */

/**
 * @abstract
 * Class that makes it easier to deal with a series of async events
 * (represented as Promises). All the function let you interact with
 * the promise's value instead of the promise itself, letting you 
 * treat it as a stream of synchronuous values. The notable exception
 * being the `pull` method, which should be used to consume the stream,
 * and hence must return the promise directly.
 * @template T
 */
export default class AsyncStream {
    /** @typedef {TStreamItem<T>} TItem */

    /**
     * @abstract
     * Take the next item off the stream
     * @return {PromiseLike<TItem>}
     */
    pull() { return null; }

    /**
     * Transform the stream's items
     * @template B
     * @param {function(T): B | PromiseLike<B>} mapper 
     * @return {AsyncStream<B>}
     */
    map(mapper) {
        return new MappingAsyncStream(this, mapper);
    }

    /**
     * Select only the stream items for which `predicate` returns true
     * @param {function(T): Boolean} predicate 
     * @return {AsyncStream<T>}
     */
    filter(predicate) {
        return new FilteringAsyncStream(this, predicate);
    }

    /**
     * Load multiple items of the stream at the time to avoid long wait
     * times between `pull`s. Starts `bufferSize` promises at a time 
     * (simultaneously).
     * @param {Number} bufferSize 
     * @return {AsyncStream<T>}
     */
    buffer(bufferSize) {
        return new BufferingAsyncStream(this, bufferSize);
    }

    /**
     * If the current stream is an array of items, this expands the
     * stream into a stream such that every element of the array 
     * becomes its own item.
     * @template T2
     * @this {AsyncStream<T2[]>}
     * @return {AsyncStream<T2>}
     */
    flatten() {
        return new FlatteningAsyncStream(this);
    }

    /**
     * Create a stream that iterates from `start` to `end` (inclusive)
     * @param {number} start 
     * @param {number} end 
     * @return {AsyncStream<number>}
     */
    static range(start, end) {
        return new RangeAsyncStream(start, end);
    }
}

/**
 * @private
 * @extends AsyncStream<number>
 * An async stream the returns numbers in a range (inclusive)
 */
class RangeAsyncStream extends AsyncStream {
    /**
     * @param {number} start 
     * @param {number} end 
     */
    constructor(start, end) {
        super();
        this.start = start;
        this.end = end;
        this.cur = start;
    }

    pull() {
        if (this.cur <= this.end) {
            return Promise.resolve({ value: this.cur++, done: false });
        } else {
            return Promise.resolve({ value: null, done: true });
        }
    }
}

/**
 * @private
 * @template T1, T2
 * @extends AsyncStream<T2>
 */
class MappingAsyncStream extends AsyncStream {
    /**
     * 
     * @param {AsyncStream<T1>} parent 
     * @param {(x: T1) => T2 | PromiseLike<T2>} mapper 
     */
    constructor(parent, mapper) {
        super();
        this.parent = parent;
        this.mapper = mapper;
    }

    pull() {
        return this.parent.pull()
        .then(item => {
            if (item.done) {
                return Promise.resolve({ value: null, done: true });
            }

            var mapped = this.mapper(item.value);
            if (!(mapped instanceof Promise)) {
                mapped = Promise.resolve(mapped);
            }
            return /** @type {PromiseLike<T2>} */(mapped).then(value => {
                return { value, done: false }
            });
        });
    }
}

/**
 * @private
 * @template T
 * @extends AsyncStream<T>
 */
class FlatteningAsyncStream extends AsyncStream {
    /**
     * @param {AsyncStream<T[]>} parent 
     */
    constructor(parent) {
        super();
        this.parent = parent;
        /** @type {Array<T>} */
        this._lastResult = [];
        /** @type {PromiseLike<T[]>} */
        this._inProgress = null;
    }

    pull() {
        if (this._lastResult.length) {
            return Promise.resolve({ value: this._lastResult.shift(), done: false });
        } else if (this._inProgress) {
            this._inProgress = this._inProgress.then(() => this.pull());
            return this._inProgress;
        } else {
            this._inProgress = this.parent.pull()
            .then(item => {
                if (item.done) {
                    return Promise.resolve({ value: null, done: true });
                }

                this._lastResult = item.value;
                this._inProgress = null;
                return this.pull();
            });
            return this._inProgress;
        }
    }
}

/**
 * @private
 * @template T
 * @extends AsyncStream<T>
 */
class BufferingAsyncStream extends AsyncStream {
    /**
     * @param {AsyncStream<T>} parent
     * @param {Number} bufferSize
     */
    constructor(parent, bufferSize) {
        super();
        this.parent = parent;
        this._bufferSize = bufferSize;
        /** @type {PromiseLike<TStreamItem<T>>[]} */
        this._promiseBuffer = [];
    }

    pull() {
        var toFetch = Math.max(0, this._bufferSize - this._promiseBuffer.length + 1);
        for (var i = 0; i < toFetch; i++) {
            this._promiseBuffer.push(this.parent.pull());
        }

        return this._promiseBuffer.shift();;
    }
}
