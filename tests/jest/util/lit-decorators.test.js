import { LitElement, html } from 'lit';
import { customElement, property, state, query } from '@/src/util/lit-decorators.js';

@customElement('br-test-decorated')
class DecoratedElement extends LitElement {
  @property({ type: Array })
  items = [];

  @property({ type: Number })
  count = 3;

  @property({ type: String })
  label;

  @state()
  hidden = false;

  @query('#target')
  target;

  updatedKeys = [];

  updated(changed) {
    this.updatedKeys.push(...changed.keys());
  }

  render() {
    return html`<span id="target">${this.count}</span>`;
  }
}

@customElement('br-test-decorated-child')
class DecoratedChild extends DecoratedElement {
  @property({ type: Number })
  count = 10;

  @property({ type: String })
  extra = 'x';
}

describe('lit-decorators', () => {
  afterEach(() => document.body.innerHTML = '');

  test('Reactive fields are accessors, not instance properties', () => {
    const el = new DecoratedElement();
    for (const key of ['items', 'count', 'label', 'hidden', 'target']) {
      expect(Object.getOwnPropertyDescriptor(el, key)).toBeUndefined();
      expect(Object.getOwnPropertyDescriptor(DecoratedElement.prototype, key).get).toBeInstanceOf(Function);
    }
  });

  test('Initial values are applied per instance', () => {
    const a = new DecoratedElement();
    const b = new DecoratedElement();
    expect(a.count).toBe(3);
    expect(a.label).toBeUndefined();
    expect(a.hidden).toBe(false);
    expect(a.items).toEqual([]);
    expect(a.items).not.toBe(b.items);
  });

  test('Setting a property or state triggers an update', async () => {
    const el = new DecoratedElement();
    document.body.appendChild(el);
    await el.updateComplete;
    el.updatedKeys = [];

    el.count = 4;
    el.hidden = true;
    await el.updateComplete;
    expect(el.updatedKeys.sort()).toEqual(['count', 'hidden']);
    expect(el.shadowRoot.querySelector('#target').textContent).toBe('4');
  });

  test('Attributes map to properties', async () => {
    const el = document.createElement('br-test-decorated');
    el.setAttribute('count', '7');
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.count).toBe(7);
  });

  test('query reads from the render root', async () => {
    const el = new DecoratedElement();
    expect(el.target).toBeNull();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.target).toBe(el.shadowRoot.querySelector('#target'));
  });

  test('Subclasses inherit fields and can override defaults', async () => {
    const el = new DecoratedChild();
    expect(el.count).toBe(10);
    expect(el.extra).toBe('x');
    expect(el.hidden).toBe(false);
    document.body.appendChild(el);
    await el.updateComplete;
    el.count = 11;
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('#target').textContent).toBe('11');
  });
});
