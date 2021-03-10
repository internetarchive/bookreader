/**
 * Wait until some time has passed before executing a callback.
 *
 * @param {Function} callback
 * @param {Number}   threshhold - in milliseconds
 * @param {*}        context    - will be bound to callback as its "this" value
 */
class Debouncer {
  constructor(callback, threshhold = 250, context = undefined) {
    this.callback = callback;
    this.threshhold = threshhold;
    this.context = context;
    this.deferTimeout = undefined;
  }

  execute() {
    clearTimeout(this.deferTimeout);
    this.deferTimeout = setTimeout(this.executeCallback.bind(this), this.threshhold);
  }

  executeCallback() {
    this.callback.apply(this.context);
  }
}

export { Debouncer as default };
