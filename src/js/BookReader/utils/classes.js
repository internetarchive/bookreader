/**
 * Exposes a function from a property onto the main class, in such a way that if the
 * main class's method is overriden, the property's class is also overriden.
 * WARNING: This modifies the property class' _prototype_! So it can only be called one.
 * (It must be this way, because BookReader.prototype is overriden usually before any instance
 * is created.)
 * @template TFrom The class we'll be getting the method from
 * @template TTo the class we'll be adding the method to
 * @param {new () => TFrom} FromClass the class to get the method from
 * @param {string} fromMethod the method's name in FromClass
 * @param {function(TFrom): TTo} fromTransform how to get the TTo this to use when setting the method on TFrom
 * @param {new () => TTo} ToClass the class to add the method to
 * @param {string} toMethod the name of the method to add to TTo
 * @param {function(TTo): TFrom} toTransform how to get the TFrom this to use when calling the new method
 */
export function exposeTwoWay(FromClass, fromMethod, fromTransform, ToClass, toMethod, toTransform) {
    const makeWrapper = fn => {
      return /** @this {TTo} */ function() {
        return fn.apply(toTransform(this), arguments);
      }
    };
    let wrapper = makeWrapper(FromClass.prototype[fromMethod]);
  
    Object.defineProperty(ToClass.prototype, toMethod, {
      get() { return wrapper; },
      set(overrideFn) {
        // Overrides expect `this` to be BookReader, so bind as such
        FromClass.prototype[fromMethod] = /** @this {TFrom} */ function() {
          return overrideFn.apply(fromTransform(this), arguments);
        };
        wrapper = makeWrapper(FromClass.prototype[fromMethod]);
      }
    });
}
