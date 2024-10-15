/**
 * Exposes a function from one class (FromClass) to another (ToClass), in such a way
 * that if the ToClass's method is overridden, the FromClass's method is also overridden.
 * WARNING: This modifies FromClass' prototype! So FromClasses cannot be shared between
 * different ToClasses.
 * @param {new () => TFrom} FromClass the class to get the method from
 * @param {keyof TFrom} fromMethod the method's name in FromClass
 * @param {function(TFrom): TTo} fromTransform how to get the TTo `this` to use when setting the method on TFrom
 * @param {new () => TTo} ToClass the class to add the method to
 * @param {string} toMethod the name of the method to add to TTo (likely will be equal to fromMethod)
 * @param {function(TTo): TFrom} toTransform how to get the TFrom this to use when calling the new method
 * @template TFrom type of FromClass for type-checking/autocomplete
 * @template TTo type of ToClass for type-checking/autocomplete
 */
export function exposeOverrideable(FromClass, fromMethod, fromTransform, ToClass, toMethod, toTransform) {
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
    },
  });
}
