// @ts-check
import { customElement, property, query } from 'lit/decorators.js';
import {LitElement, html} from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { ModeSmoothZoom } from './ModeSmoothZoom.js';
import { arrChanged, genToArray, sum, throttle } from './utils.js';
import { HTMLDimensionsCacher } from "./utils/HTMLDimensionsCacher.js";
import { ScrollClassAdder } from './utils/ScrollClassAdder.js';
import { ModeCoordinateSpace } from './ModeCoordinateSpace.js';
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
  /** @type {'width' | 'height' | 'auto' | 'none'} */
  autoFit = 'auto';
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

  /** @type {ModeCoordinateSpace} Manage conversion between coordinates */
  coordSpace = new ModeCoordinateSpace(this);

  @property({ type: Number })
  scale = 1;

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
    const wToR = this.coordSpace.worldUnitsToRenderedPixels;
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
    const currentScale = this.scale;
    
    console.log(`🔍 SIMPLE JUMP: Going to page ${index}, scale: ${currentScale}`);
    
    // Make sure we have page positions
    if (!this.pageTops[index]) {
      this.pageTops = this.computePageTops(this.pages, this.SPACING_IN);
    }
    
    // For HIGH ZOOM (> 2.0): Go to center of target page
    if (currentScale > 2.0) {
      console.log(`🎯 HIGH ZOOM: Centering page ${index}`);
      
      const targetPage = this.pages.find(p => p.index === index);
      if (!targetPage) {
        console.error(`❌ Page ${index} not found!`);
        return;
      }
      
      // Calculate center of the TARGET page
      const pageTop = this.pageTops[index];
      const pageHeight = targetPage.heightInches;
      const pageCenterY = pageTop + (pageHeight / 2);
      
      // Calculate scroll position to center the page
      const viewportHeight = this.coordSpace.visiblePixelsToWorldUnits(this.htmlDimensionsCacher.clientHeight);
      const targetScrollTop = this.coordSpace.worldUnitsToVisiblePixels(pageCenterY - (viewportHeight / 2));
      
      console.log(`📍 Scrolling to center: ${targetScrollTop}`);
      
      // Navigate to center
      this.scrollTop = Math.max(0, targetScrollTop);
      
    } else {
      // NORMAL ZOOM: Go to top of page
      console.log(`📄 NORMAL ZOOM: Going to top of page ${index}`);
      
      const targetScrollTop = this.coordSpace.worldUnitsToVisiblePixels(this.pageTops[index] - this.SPACING_IN / 2);
      this.scrollTop = targetScrollTop;
    }
    
    // Force update after any navigation
    setTimeout(() => {
      this.updateVisibleRegion();
      this.throttledUpdateRenderedPages();
      console.log(`✅ Navigation to page ${index} COMPLETE`);
    }, 100);
  }

  zoomIn() {
    const newScale = this.scale * 1.1; // Same zoom factor as two-page mode (NO LIMIT)
    if (newScale !== this.scale) {
      this.scale = newScale;
      this.requestUpdate();
      // Force update visible region to prevent black screen issues
      setTimeout(() => {
        this.updateVisibleRegion();
        this.throttledUpdateRenderedPages();
      }, 50);
    }
  }

  zoomOut() {
    const newScale = this.scale / 1.1; // Same zoom factor as two-page mode
    if (newScale !== this.scale) {
      this.scale = newScale;
      this.requestUpdate();
      // Force update visible region to prevent black screen issues
      setTimeout(() => {
        this.updateVisibleRegion();
        this.throttledUpdateRenderedPages();
        // Ensure proper centering after zoom - removed scrollIntoView as it causes navigation issues
      }, 50);
    }
  }

  /********************************************/
  /************** INTERNAL STUFF **************/
  /********************************************/

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
      this.updatePages();
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
      if (this.visiblePages.length) {
        // unclear why this is ever really happening
        this.br.displayedIndices = this.visiblePages.map(p => p.index);
        this.br.updateFirstIndex(this.br.displayedIndices[0]);
        // Trigger an event to update the navbar instead of accessing private property
        this.br.trigger('pageVisible', { pageContainerEl: null });
      }
    }
    if (changedProps.has('scale')) {
      const oldVal = changedProps.get('scale');
      // Need to set this scale to actually scale the pages
      this.$visibleWorld.style.transform = `scale(${this.scale})`;
      this.smoothZoomer.updateViewportOnZoom(this.scale, oldVal);
      this.updateVisibleRegion();
      // Need to set this scale to update the world size, so the scrollbar gets the correct size
      this.$world.style.transform = `scale(${this.scale})`;
    }
  }

  updatePages() {
    this.pages = genToArray(this.book.pagesIterator({ combineConsecutiveUnviewables: true }));
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
    const wToR = this.coordSpace.worldUnitsToRenderedPixels;
    const wToV = this.coordSpace.worldUnitsToVisiblePixels;
    const containerWidth = this.coordSpace.visiblePixelsToWorldUnits(this.htmlDimensionsCacher.clientWidth);

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
    // Prevent trigger pageVisible when scrolling outside of BookReader
    const wasVisible = pageContainerEl.classList.contains('BRpage-visible');
    const visibleStatus = pageContainerEl.classList.toggle('BRpage-visible', this.visiblePages.includes(page));
    if (visibleStatus && !wasVisible) {
      this.br.trigger('pageVisible', { pageContainerEl });
    }
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

    const vToW = this.coordSpace.visiblePixelsToWorldUnits;
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
    this.renderedPages = this.computeRenderedPages();
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
    const containerWidthIn = this.coordSpace.renderedPixelsToWorldUnits(this.clientWidth);
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
