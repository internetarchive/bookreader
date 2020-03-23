/**
 * Resolves after all enqueued callbacks in the event loop have resolved.
 * @return {Promise}
 */
export function afterEventLoop() {
    // Waiting 0 seconds essentially lets us run at the end of the event
    // loop (i.e. after any promises which aren't _actually_ async have finished)
    return new Promise(res => setTimeout(res, 0));
}

/**
 * Event target mixin
 * @return {EventTarget}
 */
export function eventTargetMixin() {
    return {
        addEventListener(evName, listener) {
            const listeners = this._listeners[evName] || [];
            listeners.push(listener);
            this._listeners[evName] = listeners;
        },
        dispatchEvent(evName, ev) {
            const listeners = this._listeners[evName] || [];
            listeners.forEach(fn => fn(ev));
        },
        removeEventListener(evName, listener) {
            const listeners = this._listeners[evName] || [];
            this._listeners[evName] = listeners.filter(fn => fn != listener);
        },
        _listeners: {},
    };
}

/**
 * Lazy deep copy function; only supports objects (no classes)
 * @template T
 * @param {T} obj 
 * @return {T}
 */
export function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}
