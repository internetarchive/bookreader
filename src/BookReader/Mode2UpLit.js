// @ts-check
import { customElement, property, query } from 'lit/decorators.js';
import {LitElement, html} from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { ModeSmoothZoom } from './ModeSmoothZoom';
import { arrChanged, calcScreenDPI, genToArray, promisifyEvent, sleep } from './utils';
import { HTMLDimensionsCacher } from "./utils/HTMLDimensionsCacher";
/** @typedef {import('./BookModel').BookModel} BookModel */
/** @typedef {import('./BookModel').PageIndex} PageIndex */
/** @typedef {import('./BookModel').PageModel} PageModel */
/** @typedef {import('./ModeSmoothZoom').SmoothZoomable} SmoothZoomable */
/** @typedef {import('./PageContainer').PageContainer} PageContainer */
/** @typedef {import('../BookReader').default} BookReader */

// I _have_ to make this globally public, otherwise it won't let me call
// it's constructor :/
/** @implements {SmoothZoomable} */
@customElement('br-mode-2up')
export class Mode2UpLit extends LitElement {
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

  bookTranslate = { x: 0, y: 0 };

  /** @type {import('./options').AutoFitValues} */
  @property({ type: String })
  autoFit = 'auto';

  /************** VIRTUAL-SCROLLING PROPERTIES **************/

  /** @type {PageModel[]} */
  @property({ type: Array, hasChanged: arrChanged })
  visiblePages = [];

  /** @type {PageModel | null} */
  get pageLeft() {
    return this.visiblePages.find(p => p.pageSide == 'L');
  }

  /** @type {PageModel | null} */
  get pageRight() {
    return this.visiblePages.find(p => p.pageSide == 'R');
  }

  /** @type {PageModel[]} */
  @property({ type: Array })
  renderedPages = [];

  /** @type {Record<PageIndex, PageContainer>} position in inches */
  pageContainerCache = {};

  /************** DOM-RELATED PROPERTIES **************/

  /** @type {HTMLElement} */
  get $container() { return this; }

  /** @type {HTMLElement} */
  get $visibleWorld() { return this.$book; }

  /** @type {HTMLElement} */
  @query('.br-mode-2up__book')
  $book;

  get positions() {
    return this.computePositions(this.pageLeft, this.pageRight);
  }

  /** @param {PageModel} page */
  computePageHeight(page) {
    return this.book.getMedianPageSizeInches().height;
  }

  /** @param {PageModel} page */
  computePageWidth(page) {
    return page.widthInches * this.computePageHeight(page) / page.heightInches;
  }

  /**
   * @param {PageModel | null} pageLeft
   * @param {PageModel | null} pageRight
   */
  computePositions(pageLeft, pageRight) {
    const computePageWidth = this.computePageWidth.bind(this);
    const numLeafs = this.book.getNumLeafs();
    const leafEdgesLeftStart = 0;
    const leftPagesCount = this.book.pageProgression == 'lr' ? (pageLeft?.index ?? 0) : (!pageLeft ? 0 : numLeafs - pageLeft.index);
    const leafEdgesLeftWidth = Math.ceil(leftPagesCount / 2) * this.PAGE_THICKNESS_IN;
    const leafEdgesLeftEnd = leafEdgesLeftStart + leafEdgesLeftWidth;
    const pageLeftStart = leafEdgesLeftEnd;
    const pageLeftEnd = !pageLeft ? pageLeftStart + computePageWidth(pageRight.right) : pageLeftStart + computePageWidth(pageLeft);
    const pageRightStart = pageLeftEnd;
    const pageRightEnd = !pageRight ? pageRightStart : pageRightStart + computePageWidth(pageRight);
    const leafEdgesRightStart = pageRightEnd;
    const rightPagesCount = this.book.pageProgression == 'lr' ? (!pageRight ? 0 : numLeafs - pageRight.index) : (pageRight?.index ?? 0);
    const leafEdgesRightWidth = Math.ceil(rightPagesCount / 2) * this.PAGE_THICKNESS_IN;
    const leafEdgesRightEnd = leafEdgesRightStart + leafEdgesRightWidth;
    const bookWidth = leafEdgesRightEnd;
    return {
      leafEdgesLeftStart,
      leafEdgesLeftWidth,
      leafEdgesLeftEnd,
      pageLeftStart,
      pageLeftEnd,
      pageRightStart,
      pageRightEnd,
      leafEdgesRightStart,
      leafEdgesRightWidth,
      leafEdgesRightEnd,
      bookWidth,
    };
  }

  /** @type {HTMLDimensionsCacher} Cache things like clientWidth to reduce repaints */
  htmlDimensionsCacher = new HTMLDimensionsCacher(this);

  smoothZoomer = new ModeSmoothZoom(this);

  /************** CONSTANT PROPERTIES **************/

  /** How much to zoom when zoom button pressed */
  ZOOM_FACTOR = 1.1;

  /** How thick a page is in the real world, as an estimate for the leafs */
  PAGE_THICKNESS_IN = 0.002;

  /****************************************/
  /************** PUBLIC API **************/
  /****************************************/

  /************** MAIN PUBLIC METHODS **************/

  /**
   * @param {PageIndex} index
   * TODO Remove smooth option from everywhere.
   */
  async jumpToIndex(index, { smooth = false } = {}) {
    await this.flipAnimation(index);
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
    this.visiblePages = [
      page,
      page.pageSide === 'R' ? page.left : page.right,
    ].filter(p => p);
    this.htmlDimensionsCacher.updateClientSizes();
    this.resizeViaAutofit(page);
  }

  /** @override */
  updated(changedProps) {
    // this.X is the new value
    // changedProps.get('X') is the old value
    if (changedProps.has('book')) {
      this.pages = genToArray(this.book.pagesIterator({ combineConsecutiveUnviewables: true }));
    }
    if (changedProps.has('visiblePages')) {
      this.renderedPages = this.computeRenderedPages();
      this.br.displayedIndices = this.visiblePages.map(p => p.index);
      this.br.updateFirstIndex(this.br.displayedIndices[0]);
      this.br._components.navbar.updateNavIndexThrottled();
    }
    if (changedProps.has('autoFit')) {
      if (this.autoFit != 'none') {
        this.style.overflow = 'hidden';
      } else {
        this.style.overflow = 'auto';
        this.resizeViaAutofit();
      }
    }
    if (changedProps.has('scale')) {
      const oldVal = changedProps.get('scale');
      this.$book.style.transform = `translate(${this.bookTranslate.x}px, ${this.bookTranslate.y}px) scale(${this.scale})`;
      this.updateViewportOnZoom(this.scale, oldVal);
    }
  }

  resizeViaAutofit(page = this.visiblePages[0]) {
    const {scale, translate} = this.computeDefaultTransform(page, this.autoFit);
    this.scale = scale;
    this.bookTranslate = translate;
  }

  /** @override */
  connectedCallback() {
    super.connectedCallback();
    this.htmlDimensionsCacher.attachResizeListener();
    this.smoothZoomer.attach();
  }

  /** @override */
  disconnectedCallback() {
    this.htmlDimensionsCacher.detachResizeListener();
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
      <div class="br-mode-2up__book" @mouseup=${this.handlePageClick}>
        ${this.renderLeafEdges('left')}
        ${this.renderedPages.map(p => this.renderPage(p))}
        ${this.renderLeafEdges('right')}
      </div>`;
  }

  /**
   * @param {MouseEvent} ev
   */
  handlePageClick = (ev) => {
    // right click
    if (ev.which == 3 && this.br.protected) {
      return false;
    }

    if (ev.which != 1) return;

    const $page = $(ev.target).closest('.BRpagecontainer');
    if (!$page.length) return;
    if ($page.data('side') == 'L') this.flipAnimation('left');
    else if ($page.data('side') == 'R') this.flipAnimation('right');
  }

  /** @param {PageModel} page */
  createPageContainer = (page) => {
    return this.pageContainerCache[page.index] || (
      this.pageContainerCache[page.index] = (
        // @ts-ignore I know it's protected, TS! But Mode2Up and BookReader are friends.
        this.br._createPageContainer(page.index)
      )
    );
  }

  /**
   * @param {'left' | 'right'} side
   **/
  renderLeafEdges = (side) => {
    if (!this.visiblePages.length) return html``;
    const wToR = this.worldUnitsToRenderedPixels;
    const width = wToR(side == 'left' ? this.positions.leafEdgesLeftWidth : this.positions.leafEdgesRightWidth);
    if (!width) return html``;
    const height = wToR(this.computePageHeight(this.visiblePages[0]));
    const left = wToR(side == 'left' ? this.positions.leafEdgesLeftStart : this.positions.leafEdgesRightStart);
    const prog = this.book.pageProgression;
    const pair = `${prog}, ${side}`;
    let range = [];
    switch (pair) {
    case 'lr, left':
      range = [0, this.pageLeft.index];
      break;
    case 'lr, right':
      range = [this.pageRight.index, this.book.getNumLeafs() - 1];
      break;
    case 'rl, left':
      range = [this.book.getNumLeafs() - 1, this.pageLeft.index];
      break;
    case 'rl, right':
      range = [this.pageRight.index, 0];
      break;
    default:
      throw new Error(`Unexpected pair: ${pair}`);
    }

    return html`
      <br-leaf-edges
        leftIndex=${range[0]}
        rightIndex=${range[1]}
        .book=${this.book}
        .pageClickHandler=${(index) => this.jumpToIndex(index)}
        side=${side}
        class="br-mode-2up__leafs br-mode-2up__leafs--${side}"
        style=${styleMap({width: `${width}px`, height: `${height}px`, left: `${left}px`})}
      ></br-leaf-edges>
    `;
  }

  /** @param {PageModel} page */
  renderPage = (page) => {
    const wToR = this.worldUnitsToRenderedPixels;
    const wToV = this.worldUnitsToVisiblePixels;

    const width = wToR(this.computePageWidth(page));
    const height = wToR(this.computePageHeight(page));
    const isVisible = this.visiblePages.map(p => p.index).includes(page.index);
    const positions = this.computePositions(page.spread.left, page.spread.right);

    // const transform = `translate(${wToR(left)}px, ${wToR(top)}px)`;
    const pageContainerEl = this.createPageContainer(page)
      .update({
        dimensions: {
          width,
          height,
          top: 0,
          left: wToR(page.pageSide == 'L' ? positions.pageLeftStart : positions.pageLeftEnd),
        },
        reduce: page.width / wToV(this.computePageWidth(page)),
      }).$container[0];

    // pageContainerEl.style.transform = transform;
    pageContainerEl.classList.toggle('BRpage-visible', isVisible);
    return pageContainerEl;
  }

  /************** VIRTUAL FLIPPING LOGIC **************/

  /**
   * @returns {PageModel[]}
   */
  computeRenderedPages() {
    // Also render 2 pages before/after
    // @ts-ignore TS doesn't understand the filtering out of null values
    return [
      this.visiblePages[0]?.prev?.prev,
      this.visiblePages[0]?.prev,
      ...this.visiblePages,
      this.visiblePages[this.visiblePages.length - 1]?.next,
      this.visiblePages[this.visiblePages.length - 1]?.next?.next,
    ]
      .filter(p => p)
      // Never render more than 10 pages! Usually means something is wrong
      .slice(0, 10);
  }

  /**
   * @param {PageModel} page
   * @param {import('./options').AutoFitValues} autoFit
   */
  computeDefaultTransform(page, autoFit) {
    // debugger;
    const spread = page.spread;
    // Default to real size if it fits, otherwise default to full height
    const bookWidth = this.computePositions(spread.left, spread.right).bookWidth;
    const bookHeight = this.computePageHeight(spread.left || spread.right);
    const BOOK_PADDING_PX = 10;
    const curScale = this.scale;
    this.scale = 1; // Need this temporarily
    const widthScale = this.renderedPixelsToWorldUnits(this.htmlDimensionsCacher.clientWidth - 2 * BOOK_PADDING_PX) / bookWidth;
    const heightScale = this.renderedPixelsToWorldUnits(this.htmlDimensionsCacher.clientHeight - 2 * BOOK_PADDING_PX) / bookHeight;
    this.scale = curScale;
    const realScale = 1;

    let scale = realScale;
    if (autoFit == 'width') {
      scale = Math.min(widthScale, 1);
    } else if (autoFit == 'height') {
      scale = Math.min(heightScale, 1);
    } else if (autoFit == 'auto') {
      scale = Math.min(widthScale, heightScale, 1);
    } else if (autoFit == 'none') {
      scale = this.scale;
    } else {
      // Should be impossible
      throw new Error(`Invalid autoFit value: ${autoFit}`);
    }

    const visibleBookWidth = this.worldUnitsToRenderedPixels(bookWidth) * scale;
    const visibleBookHeight = this.worldUnitsToRenderedPixels(bookHeight) * scale;
    const translateX = (this.htmlDimensionsCacher.clientWidth - visibleBookWidth) / 2;
    const translateY = (this.htmlDimensionsCacher.clientHeight - visibleBookHeight) / 2;

    return { scale, translate: { x: translateX, y: translateY } };
  }

  /**
   * @param {'left' | 'right' | 'next' | 'prev' | PageIndex | {left: PageModel | null, right: PageModel | null}} nextSpread
   */
  async flipAnimation(nextSpread) {
    if (nextSpread == 'next') {
      nextSpread = this.book.pageProgression == 'lr' ? 'right' : 'left';
    } else if (nextSpread == 'prev') {
      nextSpread = this.book.pageProgression == 'lr' ? 'left' : 'right';
    }

    const curSpread = (this.pageLeft || this.pageRight).spread;

    if (nextSpread == 'left') {
      nextSpread = curSpread.left.left.spread;
    } else if (nextSpread == 'right') {
      nextSpread = curSpread.right.right.spread;
    }

    if (typeof(nextSpread) == 'number') {
      nextSpread = this.book.getPage(nextSpread).spread;
    }

    const curLeftIndex = curSpread.left?.index ?? -1;
    const nextLeftIndex = nextSpread.left?.index ?? -1;
    if (curLeftIndex == nextLeftIndex) return;

    const progression = this.book.pageProgression;
    // This table is used to determine the direction of the flip animation:
    //    | < | >
    // lr | L | R
    // rl | R | L
    const direction = progression == 'lr' ? (nextLeftIndex > curLeftIndex ? 'right' : 'left') : (nextLeftIndex > curLeftIndex ? 'left' : 'right');

    this.classList.add(`br-mode-2up--flipping-${direction}`);
    this.classList.add(`BRpageFlipping`);

    const renderedIndices = this.renderedPages.map(p => p.index);
    /** @type {PageContainer[]} */
    const nextPageContainers = [];
    for (const page of [nextSpread.left, nextSpread.right]) {
      if (!page) continue;
      nextPageContainers.push(this.createPageContainer(page));
      if (!renderedIndices.includes(page.index)) {
        this.renderedPages.push(page);
      }
    }

    // Wait for lit update cycle to finish
    this.requestUpdate();
    await this.updateComplete;

    this.visiblePages
      .map(p => this.pageContainerCache[p.index].$container)
      .forEach($c => $c.addClass('BRpage-exiting'));

    nextPageContainers.forEach(c => c.$container.addClass('BRpage-visible BRpage-entering'));

    await Promise.race([
      ...nextPageContainers.map(c => promisifyEvent(c.$container[0], 'animationend')),
      sleep(800), // Fallback for browsers that don't support animationend
    ]);
    console.log('flip ended');

    this.classList.remove(`br-mode-2up--flipping-${direction}`);
    this.classList.remove(`BRpageFlipping`);
    this.visiblePages
      .map(p => this.pageContainerCache[p.index].$container)
      .forEach($c => $c.removeClass('BRpage-exiting BRpage-visible'));
    nextPageContainers.forEach(c => c.$container.removeClass('BRpage-entering'));

    this.visiblePages = [nextSpread.left, nextSpread.right].filter(x => x);
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
  }
}

@customElement('br-leaf-edges')
export class LeafEdges extends LitElement {
  @property({ type: Number }) leftIndex = 0;
  @property({ type: Number }) rightIndex = 0;
  /** @type {'left' | 'right'} */
  @property({ type: String }) side = 'left';

  /** @type {BookModel} */
  @property({attribute: false})
  book = null;

  /** @type {(index: PageIndex) => void} */
  @property({attribute: false, type: Function})
  pageClickHandler = null;

  @query('.br-leaf-edges__bar') $hoverBar;
  @query('.br-leaf-edges__label') $hoverLabel;

  get pageWidthPercent() {
    return 100 * 1 / (this.rightIndex - this.leftIndex + 1);
  }

  render() {
    return html`
      <div
        class="br-leaf-edges__bar"
        style="${styleMap({width: `${this.pageWidthPercent}%`})}"
      ></div>
      <div class="br-leaf-edges__label">Page</div>`;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('mouseenter', this.onMouseEnter);
    this.addEventListener('mouseleave', this.onMouseLeave);
    this.addEventListener('click', this.onClick);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.addEventListener('mouseenter', this.onMouseEnter);
    this.removeEventListener('mousemove', this.onMouseMove);
    this.removeEventListener('mouseleave', this.onMouseLeave);
  }

  /** @override */
  createRenderRoot() {
    // Disable shadow DOM; that would require a huge rejiggering of CSS
    return this;
  }

  /**
   * @param {MouseEvent} e
   */
  onMouseEnter = (e) => {
    this.addEventListener('mousemove', this.onMouseMove);
    this.$hoverBar.style.display = 'block';
    this.$hoverLabel.style.display = 'block';
  }

  /**
   * @param {MouseEvent} e
   */
  onMouseMove = (e) => {
    this.$hoverBar.style.left = `${e.offsetX}px`;
    if (this.side == 'right') {
      this.$hoverLabel.style.left = `${e.offsetX}px`;
    } else {
      this.$hoverLabel.style.right = `${this.offsetWidth - e.offsetX}px`;
    }
    this.$hoverLabel.style.top = `${e.offsetY}px`;
    const index = this.mouseEventToPageIndex(e);
    this.$hoverLabel.textContent = this.book.getPageName(index);
  }

  /**
   * @param {MouseEvent} e
   */
  onMouseLeave = (e) => {
    this.removeEventListener('mousemove', this.onMouseMove);
    this.$hoverBar.style.display = 'none';
    this.$hoverLabel.style.display = 'none';
  }

  /**
   * @param {MouseEvent} e
   */
  onClick = (e) => {
    this.pageClickHandler(this.mouseEventToPageIndex(e));
  }

  /**
   * @param {MouseEvent} e
   * @returns {PageIndex}
   */
  mouseEventToPageIndex(e) {
    return Math.floor(this.leftIndex + (e.offsetX / this.offsetWidth) * (this.rightIndex - this.leftIndex + 1));
  }
}
