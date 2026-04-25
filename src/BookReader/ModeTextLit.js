// @ts-check
import { customElement, property, query } from 'lit/decorators.js';
import { html, LitElement } from 'lit';
import '@lit-labs/virtualizer';
import { genToArray, sleep } from './utils.js';
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */
/** @typedef {import('./BookModel.js').PageModel} PageModel */
/** @typedef {import('./BookModel.js').BookModel} BookModel */
/** @typedef {import('../BookReader.js').default} BookReader */
/** @typedef {import('./PageContainer.js').PageContainer} PageContainer */
/** @typedef {import('@lit-labs/virtualizer').LitVirtualizer} LitVirtualizer */
/** @typedef {import('@lit-labs/virtualizer').VisibilityChangedEvent} VisibilityChangedEvent */

@customElement('br-mode-text')
export class ModeTextLit extends LitElement {
  /** @type {BookModel} */
  @property({ type: Object })
  book;

  /** @type {PageModel[]} */
  @property({ type: Array })
  pages = [];

  /** @type {Record<PageIndex, PageContainer | Promise<void>>} position in inches */
  pageContainerCache = {};

  /** @type {BookReader} */
  br;

  /** @type {LitVirtualizer} */
  @query('lit-virtualizer')
  virtualizerEl;

  // override to prevent scale from being set
  get scale() { return 1; }
  set scale(value) {
    // ignore
  }

  /**
   * @param {BookModel} book
   * @param {BookReader} br
   */
  constructor(book, br) {
    super();
    this.book = book;

    /** @type {BookReader} */
    this.br = br;
  }

  /**
   * @param {PageIndex} index
   */
  jumpToIndex(index, { smooth = false } = {}) {
    const elementIndex = this.pages.findIndex(p => p.index === index);
    this.virtualizerEl.element(elementIndex).scrollIntoView({
      block: 'start',
      behavior: smooth ? 'smooth' : 'auto',
    });
  }

  /** @override */
  updated(changedProps) {
    if (changedProps.has('book')) {
      this.pages = genToArray(this.book.pagesIterator({ combineConsecutiveUnviewables: true }));
    }
  }

  /** @override */
  createRenderRoot() {
    // Disable shadow DOM
    return this;
  }

  /**
   * @param {PageModel} page
   **/
  renderPage(page) {
    // Note: We don't want to call this.br._createPageContainer directly here,
    // because that will cause lit-virtualizer to render/start fetching text
    // layers for every page. lit-virtualizer expects a method that returns
    // a lit TemplateResult, which it controls when it is actually rendered.
    //
    // So we have a wrapper component, br-cached-dom-element, which internally
    // calls the BR method and manages the caching.
    return html`
      <br-cached-dom-element
        .cache=${this.pageContainerCache}
        .cacheKey=${page.index}
        .createValue=${() => this.br._createPageContainer(page.index)}
        .renderItem=${(pageContainer) => pageContainer.$container[0]}
        style="min-height: 200px; width: 100%;"
      ></br-cached-dom-element>`;
  }

  /**
   * @private
   * @param {VisibilityChangedEvent} event
   **/
  updateVisibleRegion(event) {
    if (!event) return;

    this.br.displayedIndices = this.pages.slice(event.first, event.last + 1).map(p => p.index);
    this.br.updateFirstIndex(this.pages[event.first].index);
  }

  render() {
    return html`
      <lit-virtualizer
        scroller
        style="padding-bottom: 35px; height: 100%; box-sizing: border-box;"
        .items=${this.pages}
        .renderItem=${page => this.renderPage(page)}
        @visibilityChanged=${this.updateVisibleRegion.bind(this)}
      ></lit-virtualizer>
    `;
  }
}


/**
 * @template {string | number | symbol} TKey
 * @template {object} TValue
 */
@customElement('br-cached-dom-element')
class CachedDomElement extends LitElement {
  /** @type {Record<TKey, TValue | Promise<void>>} */
  @property({ type: Object })
  cache;

  /** @type {function(): TValue} */
  @property({ type: Function })
  createValue;

  /** @type {function(TValue): HTMLElement | import('lit').TemplateResult} */
  @property({ type: Function })
  renderItem;

  /** @type {TKey} */
  @property({ type: Object })
  cacheKey;

  @property({ type: Number })
  delay = 300;

  /** @type {TValue|undefined} */
  value;

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadValue();
  }

  render() {
    return html`
      ${this.value ? this.renderItem(this.value) : ''}
    `;
  }

  async loadValue() {
    const cachedValue = this.cache[this.cacheKey];

    if (cachedValue instanceof Promise) {
      // computation in progress, do nothing
    }
    else if (cachedValue) {
      // already cached, use it
      // (Technically this is a type error, since we're using Promise as a
      // sentinel value, but it works in practice since we never actually
      // store promises in the cache.)
      this.value = /** @type {TValue} */ (cachedValue);
      this.requestUpdate();
    } else {
      // not cached, start computation and cache the promise
      this.cache[this.cacheKey] = sleep(this.delay).then(() => {
        if (!this.isConnected) {
          // No longer want the value, delete the promise in the cache
          delete this.cache[this.cacheKey];
        } else {
          this.cache[this.cacheKey] = this.value = this.createValue();
          this.requestUpdate();
        }
      });
    }
  }
}
