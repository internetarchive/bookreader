/**
 * Exposes a function from one class (FromClass) to another (ToClass), in such a way
 * that if the ToClass's method is overriden, the FromClass's method is also overriden.
 * WARNING: This modifies FromClass' prototype! So FromClasses cannot be shared between
 * different ToClasses.
 * @template TFrom the class we'll be getting the method from
 * @template TTo the class we'll be adding the method to
 * @param {new () => TFrom} FromClass the class to get the method from
 * @param {string} fromMethod the method's name in FromClass
 * @param {function(TFrom): TTo} fromTransform how to get the TTo `this` to use when setting the method on TFrom
 * @param {new () => TTo} ToClass the class to add the method to
 * @param {string} toMethod the name of the method to add to TTo (likely will be equal to fromMethod)
 * @param {function(TTo): TFrom} toTransform how to get the TFrom this to use when calling the new method
 */
export function exposeTwoWay(FromClass, fromMethod, fromTransform, ToClass, toMethod, toTransform) {
  // Wrapper function needed to "capture" the current version of fromMethod
  let wrapper = (fn => {
    return function () {
      return fn.apply(toTransform(this), arguments);
    };
  })(FromClass.prototype[fromMethod]);

  Object.defineProperty(ToClass.prototype, toMethod, {
    get() { return wrapper; },
    set(overrideFn) {
      // overrideFn expects `this` to be ToClass, so ensure as such
      // But we can also call this method from FromClass; need to ensure
      // it's always called with a ToClass
      FromClass.prototype[fromMethod] = function () {
        const newThis = this instanceof FromClass ? fromTransform(this) : this;
        return overrideFn.apply(newThis, arguments);
      };
      wrapper = overrideFn;
    }
  });
}
