/**
 * Contains some polyfills. These should ideally be imported from other packages, but
 * that's causing the webpack bundle file size to explode :/
 */

export function auto() {
    if (!Array.prototype.find) {
        Object.defineProperty(Array.prototype, 'find', {
            value: find,
            configurable: true,
            writable: true
        });
    }
}

/**
 * Polyfill for Array.prototype.find, as based on:
 * - https://www.ecma-international.org/ecma-262/6.0/#sec-array.prototype.find
 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
 * - https://github.com/paulmillr/Array.prototype.find/blob/master/implementation.js
 * Notable differences: we don't throw errors in as many cases. We don't use the npm
 * module because it ends up being very large (for some reason); ~23kB!
 * @template T
 * @this {T[]}
 * @param {(element: T, index: number, array: T[]) => boolean} predicate 
 * @param {any} [thisArg] argument used as "this" for predicate
 * @return {T | undefined}
 */
export function find(predicate, thisArg=undefined) {
    const arrLen = this.length || 0;
    for(let i = 0; i < arrLen; i++) {
        if (predicate.call(thisArg, this[i], i, this)) {
            return this[i];
        }
    }
}
