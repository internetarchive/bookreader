import { exposeOverrideable } from '@/src/BookReader/utils/classes.js';

describe('exposeOverrideable', () => {
  test('adds method to To class', () => {
    class From { foo() { return 3; } }
    class To { }
    exposeOverrideable(From, 'foo', x => x, To, 'foo', x => x);
    expect(To.prototype).toHaveProperty('foo');
    expect(new To().foo()).toBe(3);
  });

  test('modifying To method modifies original class', () => {
    class From { foo() { return 3; } }
    class To { }
    const originalFoo = From.prototype.foo;
    exposeOverrideable(From, 'foo', x => x, To, 'foo', x => x);
    To.prototype.foo = () => 7;
    expect(originalFoo).not.toBe(From.prototype.foo);
    expect(new To().foo()).toBe(7);
    expect(new From().foo()).toBe(7);
  });

  test('can transform this', () => {
    class From { foo() { return this; } }
    class To { }
    exposeOverrideable(From, 'foo', x => 'fake-this1', To, 'foo', x => 'fake-this2');
    const f = new From();
    expect(f.foo()).toBe(f);
    expect(new To().foo()).toBe('fake-this2');
  });

  test('can transform this both ways if overriden', () => {
    class From { foo() { return [this]; } }
    class To { }
    exposeOverrideable(From, 'foo', x => 'fake-this1', To, 'foo', x => 'fake-this2');
    // Override pattern common in bookreader
    To.prototype.foo = function(_super) {
      return function() {
        return [this, ..._super.call(this)];
      };
    }(To.prototype.foo);

    const calledFromTo = new To().foo();
    expect(calledFromTo).toHaveLength(2);
    expect(calledFromTo[0]).toBeInstanceOf(To);
    expect(calledFromTo[1]).toBe('fake-this2');

    const calledFromFrom = new From().foo();
    expect(calledFromFrom).toHaveLength(2);
    expect(calledFromFrom[0]).toBe('fake-this1');
    expect(calledFromFrom[1]).toBe('fake-this2');
  });

  test('BookReader override pattern', () => {
    class Component {
      constructor(br) { this.br = br; }
      createButton() { return 'root button'; }
      // need to test that when called through a
      // Component method, that it work correctly
      initToolbar() { return [this.createButton()]; }
    }
    class BookReader {
      constructor() {
        this.component = new Component(this);
      }
    }

    exposeOverrideable(Component, 'createButton', c => c.br, BookReader, 'createButton', br => br.component);

    expect(new BookReader().createButton()).toBe('root button');
    expect(new BookReader().component.initToolbar()).toEqual(['root button']);

    // And then a bunch of plugins come along!
    for (const plugin of ['plugin 1', 'plugin 2']) {
      BookReader.prototype.createButton = function(_super) {
        return function() {
          return plugin + ' ' + _super.call(this);
        };
      }(BookReader.prototype.createButton);
    }

    const br = new BookReader();
    expect(br.createButton()).toBe('plugin 2 plugin 1 root button');
    expect(br.component.createButton()).toBe('plugin 2 plugin 1 root button');
    // Calls the overridden method on BookReader!
    expect(br.component.initToolbar()).toEqual(['plugin 2 plugin 1 root button']);
  });
});
