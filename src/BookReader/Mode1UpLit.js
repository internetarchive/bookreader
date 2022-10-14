// @ts-check
import { customElement, property, query } from 'lit/decorators.js';
import {LitElement, html} from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { ModeSmoothZoom } from './ModeSmoothZoom';
import { arrChanged, calcScreenDPI, genToArray, sum, throttle } from './utils';
import { HTMLDimensionsCacher } from "./utils/HTMLDimensionsCacher";
import { ScrollClassAdder } from './utils/ScrollClassAdder';
/** @typedef {import('./BookModel').BookModel} BookModel */
/** @typedef {import('./BookModel').PageIndex} PageIndex */
/** @typedef {import('./BookModel').PageModel} PageModel */
/** @typedef {import('./ModeSmoothZoom').SmoothZoomable} SmoothZoomable */
/** @typedef {import('./PageContainer').PageContainer} PageContainer */
/** @typedef {import('../BookReader').default} BookReader */

// I _have_ to make this globally public, otherwise it won't let me call
// it's constructor :/
/** @implements {SmoothZoomable} */
@customElement('br-mode-1up')
export class Mode1UpLit extends LitElement {
  /****************************************/
  /************** PROPERTIES **************/
  /****************************************/

  /** @type {BookReader} */
  br;

  /************** BOOK-RELATED PROPERTIES **************/

  /** @type {BookModel} */
  @property({ type: Object })
  book;

  /** @type {PageModel[]} */
  @property({ type: Array })
  pages = [];

  /** @type {Record<PageIndex, number>} in world coordinates (inches) */
  @property({ type: Object })
  pageTops = {};

  /************** SCALE-RELATED PROPERTIES **************/

  /** @private */
  screenDPI = calcScreenDPI();

  /**
   * How much smaller the rendered pages are than the real-world item
   *
   * Mode1Up doesn't use the br.reduce because it is DPI aware. The reduction factor
   * of a given leaf can change (since leaves can have different DPIs), but the real-world
   * reduction is constant throughout.
   */
  realWorldReduce = 1;

  @property({ type: Number })
  scale = 1;
  /** Position (in unit-less, [0, 1] coordinates) in client to scale around */
  @property({ type: Object })
  scaleCenter = { x: 0.5, y: 0.5 };

  /************** VIRTUAL-SCROLLING PROPERTIES **************/

  /** in world coordinates (inches) */
  @property({ type: Object })
  visibleRegion = {
    top: 0,
    left: 0,
    width: 100,
    height: 100,
  };

  /** @type {PageModel[]} */
  @property({ type: Array, hasChanged: arrChanged })
  visiblePages = [];

  /** @type {PageModel[]} */
  @property({ type: Array })
  renderedPages = [];

  /** @type {Record<PageIndex, PageContainer>} position in inches */
  pageContainerCache = {};

  /************** WORLD-RELATED PROPERTIES **************/
  /**
   * The world is an imaginary giant document that contains all the pages.
   * The "world"'s size is used to determine how long the scroll bar should
   * be, for example.
   */

  /** @type {HTMLElement} */
  @query('.br-mode-1up__world')
  $world;

  worldDimensions = { width: 100, height: 100 };

  get worldStyle() {
    const wToR = this.worldUnitsToRenderedPixels;
    return {
      width: wToR(this.worldDimensions.width) + "px",
      height: wToR(this.worldDimensions.height) + "px",
    };
  }

  /** @type {HTMLElement} */
  get $container() { return this; }

  /** @type {HTMLElement} */
  @query('.br-mode-1up__visible-world')
  $visibleWorld;

  /************** DOM-RELATED PROPERTIES **************/

  /** @type {HTMLDimensionsCacher} Cache things like clientWidth to reduce repaints */
  htmlDimensionsCacher = new HTMLDimensionsCacher(this);

  smoothZoomer = new ModeSmoothZoom(this);

  scrollClassAdder = new ScrollClassAdder(this, 'BRscrolling-active');

  /************** CONSTANT PROPERTIES **************/

  /** Vertical space between/around the pages in inches */
  SPACING_IN = 0.2;

  /** How much to zoom when zoom button pressed */
  ZOOM_FACTOR = 1.1;

  /****************************************/
  /************** PUBLIC API **************/
  /****************************************/

  /************** MAIN PUBLIC METHODS **************/

  /**
   * @param {PageIndex} index
   */
  jumpToIndex(index, { smooth = false } = {}) {
    if (smooth) {
      this.style.scrollBehavior = 'smooth';
    }
    this.scrollTop = this.worldUnitsToVisiblePixels(this.pageTops[index] - this.SPACING_IN / 2);
    // TODO: Also h center?
    if (smooth) {
      setTimeout(() => this.style.scrollBehavior = '', 100);
    }
  }

  zoomIn() {
    this.scale *= this.ZOOM_FACTOR;
  }

  zoomOut() {
    this.scale *= 1 / this.ZOOM_FACTOR;
  }

  /********************************************/
  /************** INTERNAL STUFF **************/
  /********************************************/

  /**
   *
   * @param {PageModel[]} pages
   * @returns {PageModel[]}
   */
  _adjustPageDimension(pages) {
    const clientWidth = this.htmlDimensionsCacher.clientWidth;
    const clientHeight = this.htmlDimensionsCacher.clientHeight;
    return pages.map((p) => {
      const autofitMode = this.br.onePage.autofit;
      if (
        (autofitMode == "auto" || autofitMode == "height") &&
        p.height !== clientHeight
      ) {
        p.width *= clientHeight / p.height;
        p.height = clientHeight;
      }
      if (
        ((autofitMode == "auto" && p.height !== clientHeight) ||
          autofitMode == "width") &&
        p.width > clientWidth
      ) {
        p.height *= clientWidth / p.width;
        p.width = clientWidth;
      }
      p.widthInches = p.width / p.ppi;
      p.heightInches = p.height / p.ppi;

      return p;
    });
  }

  /************** LIFE CYCLE **************/

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

  /** @override */
  firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this.htmlDimensionsCacher.updateClientSizes();
    this.smoothZoomer.attach();
  }

  /**
   * @param {PageIndex} startIndex
   */
  initFirstRender(startIndex) {
    const page = this.book.getPage(startIndex);
    this.scale = this.computeDefaultScale(page);
  }

  /** @override */
  updated(changedProps) {
    // this.X is the new value
    // changedProps.get('X') is the old value
    if (changedProps.has('book')) {
      this.pages = this._adjustPageDimension(
        genToArray(
          this.book.pagesIterator({ combineConsecutiveUnviewables: true })
        )
      );
    }
    if (changedProps.has('pages')) {
      this.worldDimensions = this.computeWorldDimensions();
      this.pageTops = this.computePageTops(this.pages, this.SPACING_IN);
    }
    if (changedProps.has('visibleRegion')) {
      this.visiblePages = this.computeVisiblePages();
    }
    if (changedProps.has('visiblePages')) {
      this.throttledUpdateRenderedPages();
      this.br.displayedIndices = this.visiblePages.map(p => p.index);
      this.br.updateFirstIndex(this.br.displayedIndices[0]);
      this.br.updateNavIndexThrottled();
    }
    if (changedProps.has('scale')) {
      const oldVal = changedProps.get('scale');
      // Need to set this scale to actually scale the pages
      this.$visibleWorld.style.transform = `scale(${this.scale})`;
      this.updateViewportOnZoom(this.scale, oldVal);
      // Need to set this scale to update the world size, so the scrollbar gets the correct size
      this.$world.style.transform = `scale(${this.scale})`;
    }
  }

  /** @override */
  connectedCallback() {
    super.connectedCallback();
    this.htmlDimensionsCacher.attachResizeListener();
    this.attachScrollListeners();
    this.smoothZoomer.attach();
  }

  /** @override */
  disconnectedCallback() {
    this.htmlDimensionsCacher.detachResizeListener();
    this.detachScrollListeners();
    this.smoothZoomer.detach();
    super.disconnectedCallback();
  }

  /************** LIT CONFIGS **************/

  /** @override */
  createRenderRoot() {
    // Disable shadow DOM; that would require a huge rejiggering of CSS
    return this;
  }

  /************** COORDINATE SPACE CONVERTERS **************/
  /**
   * There are a few different "coordinate spaces" at play in BR:
   * (1) World units: i.e. inches. Unless otherwise stated, all computations
   *     are done in world units.
   * (2) Rendered Pixels: i.e. img.width = '300'. Note this does _not_ take
   *     into account zoom scaling.
   * (3) Visible Pixels: Just rendered pixels, but taking into account scaling.
   */

  worldUnitsToRenderedPixels = (/** @type {number} */inches) => inches * this.screenDPI / this.realWorldReduce;
  renderedPixelsToWorldUnits = (/** @type {number} */px) => px * this.realWorldReduce / this.screenDPI;

  renderedPixelsToVisiblePixels = (/** @type {number} */px) => px * this.scale;
  visiblePixelsToRenderedPixels = (/** @type {number} */px) => px / this.scale;

  worldUnitsToVisiblePixels = (/** @type {number} */px) => this.renderedPixelsToVisiblePixels(this.worldUnitsToRenderedPixels(px));
  visiblePixelsToWorldUnits = (/** @type {number} */px) => this.renderedPixelsToWorldUnits(this.visiblePixelsToRenderedPixels(px));

  /************** RENDERING **************/

  /** @override */
  render() {
    return html`
      <div class="br-mode-1up__world" style=${styleMap(this.worldStyle)}></div>
      <div class="br-mode-1up__visible-world">
        ${this.renderedPages.map(p => this.renderPage(p))}
      </div>`;
  }

  /** @param {PageModel} page */
  createPageContainer = (page) => {
    return this.pageContainerCache[page.index] || (
      this.pageContainerCache[page.index] = (
        // @ts-ignore I know it's protected, TS! But Mode1Up and BookReader are friends.
        this.br._createPageContainer(page.index)
      )
    );
  }

  /** @param {PageModel} page */
  renderPage = (page) => {
    const wToR = this.worldUnitsToRenderedPixels;
    const wToV = this.worldUnitsToVisiblePixels;
    const containerWidth = this.visiblePixelsToWorldUnits(this.htmlDimensionsCacher.clientWidth);

    const width = wToR(page.widthInches);
    const height = wToR(page.heightInches);
    const left = Math.max(this.SPACING_IN, (containerWidth - page.widthInches) / 2);
    const top = this.pageTops[page.index];

    const transform = `translate(${wToR(left)}px, ${wToR(top)}px)`;
    const pageContainerEl = this.createPageContainer(page)
      .update({
        dimensions: {
          width,
          height,
          top: 0,
          left: 0,
        },
        reduce: page.width / wToV(page.widthInches),
      }).$container[0];

    pageContainerEl.style.transform = transform;
    pageContainerEl.classList.toggle('BRpage-visible', this.visiblePages.includes(page));
    return pageContainerEl;
  }

  /************** VIRTUAL SCROLLING LOGIC **************/

  updateVisibleRegion = () => {
    const { scrollTop, scrollLeft } = this;
    // clientHeight excludes scrollbars, which is good.
    const clientWidth = this.htmlDimensionsCacher.clientWidth;
    const clientHeight = this.htmlDimensionsCacher.clientHeight;

    // Note: scrollTop, and clientWidth all are in visible space;
    // i.e. they are affects by the CSS transforms.

    const vToW = this.visiblePixelsToWorldUnits;
    this.visibleRegion = {
      top: vToW(scrollTop),
      height: vToW(clientHeight),
      // TODO: These are very likely wrong
      left: vToW(scrollLeft),
      width: vToW(clientWidth),
    };
  }

  /**
   * @returns {PageModel[]}
   */
  computeRenderedPages() {
    // Also render 1 page before/after
    // @ts-ignore TS doesn't understand the filtering out of null values
    return [
      this.visiblePages[0]?.prev,
      ...this.visiblePages,
      this.visiblePages[this.visiblePages.length - 1]?.next,
    ]
      .filter(p => p)
      // Never render more than 10 pages! Usually means something is wrong
      .slice(0, 10);
  }

  throttledUpdateRenderedPages = throttle(() => {
    this.renderedPages = this._adjustPageDimension(
      this.computeRenderedPages()
    );
    this.requestUpdate();
  }, 100, null)

  /**
   * @param {PageModel[]} pages
   * @param {number} spacing
   */
  computePageTops(pages, spacing) {
    /** @type {{ [pageIndex: string]: number }} */
    const result = {};
    let top = spacing;
    for (const page of pages) {
      result[page.index] = top;
      top += page.heightInches + spacing;
    }
    return result;
  }

  /**
   * @param {PageModel} page
   * @returns {number}
   */
  computeDefaultScale(page) {
    // Default to real size if it fits, otherwise default to full width
    const containerWidthIn = this.visiblePixelsToWorldUnits(this.htmlDimensionsCacher.clientWidth);
    return Math.min(1, containerWidthIn / (page.widthInches + 2 * this.SPACING_IN)) || 1;
  }

  computeWorldDimensions() {
    return {
      width: Math.max(...this.pages.map(p => p.widthInches)) + 2 * this.SPACING_IN,
      height:
          sum(this.pages.map(p => p.heightInches)) +
          (this.pages.length + 1) * this.SPACING_IN,
    };
  }

  computeVisiblePages() {
    return this.pages.filter(page => {
      const PT = this.pageTops[page.index];
      const PB = PT + page.heightInches;

      const VT = this.visibleRegion.top;
      const VB = VT + this.visibleRegion.height;
      return PT <= VB && PB >= VT;
    });
  }

  /************** ZOOMING LOGIC **************/

  /**
   * @param {number} newScale
   * @param {number} oldScale
   */
  updateViewportOnZoom(newScale, oldScale) {
    const container = this;
    const { scrollTop: T, scrollLeft: L } = container;
    const W = this.htmlDimensionsCacher.clientWidth;
    const H = this.htmlDimensionsCacher.clientHeight;

    // Scale factor change
    const F = newScale / oldScale;

    // Where in the viewport the zoom is centered on
    const XPOS = this.scaleCenter.x;
    const YPOS = this.scaleCenter.y;
    const oldCenter = {
      x: L + XPOS * W,
      y: T + YPOS * H,
    };
    const newCenter = {
      x: F * oldCenter.x,
      y: F * oldCenter.y,
    };
    container.scrollTop = newCenter.y - YPOS * H;
    container.scrollLeft = newCenter.x - XPOS * W;
    this.updateVisibleRegion();
  }

  /************** INPUT HANDLERS **************/

  attachScrollListeners = () => {
    this.addEventListener("scroll", this.updateVisibleRegion);
    this.scrollClassAdder.attach();
  }

  detachScrollListeners = () => {
    this.removeEventListener("scroll", this.updateVisibleRegion);
    this.scrollClassAdder.detach();
  }
}
