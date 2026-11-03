// Lit's property/state/query decorators for classes compiled with Babel's
// `legacy` decorators.
//
// Babel's legacy transform defines every decorated class field as an own data
// property on each instance. That shadows the reactive accessor (or query
// getter) that Lit puts on the prototype, so `this.x = ...` stops triggering
// updates. These wrappers let Lit install its accessor, then hand Babel that
// accessor as the field's descriptor so no instance property gets defined. A
// field's initial value is assigned through the accessor when the element is
// constructed, like TypeScript's experimentalDecorators does.
//
// Lit 2 and Lit 3 both support the legacy decorator calling convention these
// wrap, so the same code runs against either.
import {
  customElement,
  property as litProperty,
  state as litState,
  query as litQuery,
} from 'lit/decorators.js';

export { customElement };

/**
 * @param {(proto: any, name: string) => any} applyLitDecorator
 * @param {{ assignInitialValue: boolean }} opts
 */
function wrapFieldDecorator(applyLitDecorator, { assignInitialValue }) {
  return (proto, name, babelDescriptor) => {
    const result = applyLitDecorator(proto, name);
    // Not a Babel legacy field (e.g. TypeScript, or an accessor): nothing to adapt.
    if (!babelDescriptor || !('initializer' in babelDescriptor)) return result;

    const { initializer } = babelDescriptor;
    if (assignInitialValue && initializer) {
      proto.constructor.addInitializer((el) => {
        el[name] = initializer.call(el);
      });
    }
    // Lit 2 defines the accessor on the prototype. Lit 3's `query` returns it
    // instead, for the transpiler to define.
    const accessor = result?.get ? result : Object.getOwnPropertyDescriptor(proto, name);
    return { configurable: true, enumerable: true, get: accessor.get, set: accessor.set };
  };
}

/** @param {import('lit/decorators.js').PropertyDeclaration} [options] */
export const property = (options) =>
  wrapFieldDecorator((proto, name) => litProperty(options)(proto, name), { assignInitialValue: true });

/** @param {import('lit/decorators.js').InternalPropertyDeclaration} [options] */
export const state = (options) =>
  wrapFieldDecorator((proto, name) => litState(options)(proto, name), { assignInitialValue: true });

/**
 * @param {string} selector
 * @param {boolean} [cache]
 */
export const query = (selector, cache) =>
  wrapFieldDecorator((proto, name) => litQuery(selector, cache)(proto, name), { assignInitialValue: false });
