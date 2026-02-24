// Keep a copy of this, since it can be overridden by sinon timers.
const _realTimeout = setTimeout;

/**
 * Resolves after all enqueued callbacks in the event loop have resolved.
 * @return {Promise}
 */
export function afterEventLoop() {
  // Waiting 0 seconds essentially lets us run at the end of the event
  // loop (i.e. after any promises which aren't _actually_ async have finished)
  return new Promise(res => _realTimeout(res, 0));
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

/** @implements {EventTarget} */
export class EventTargetSpy {
  /** @type {Record<string, Function[]} */
  _listeners = {}
  get _totalListenerCount() {
    return Object.values(this._listeners)
      .map(a => a.length)
      .reduce((a, b) => a + b, 0);
  }

  addEventListener(evName, listener) {
    const listeners = this._listeners[evName] || [];
    listeners.push(listener);
    this._listeners[evName] = listeners;
  }

  dispatchEvent(evName, ev) {
    const listeners = this._listeners[evName] || [];
    listeners.forEach(fn => fn(ev));
  }

  removeEventListener(evName, listener) {
    const listeners = this._listeners[evName] || [];
    this._listeners[evName] = listeners.filter(fn => fn != listener);
  }

  /**
   * @param {EventTarget} realEventTarget
   */
  static wrap(realEventTarget) {
    const spy = new EventTargetSpy();
    realEventTarget.addEventListener = spy.addEventListener.bind(spy);
    realEventTarget.removeEventListener = spy.removeEventListener.bind(spy);
    realEventTarget.dispatchEvent = spy.dispatchEvent.bind(spy);
    return spy;
  }
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
