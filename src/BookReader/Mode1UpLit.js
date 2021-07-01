// @ts-check
import { customElement, html, LitElement, property, query } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';
import { calcScreenDPI, debounce, genToArray, sum, throttle } from './utils';
/** @typedef {import('./BookModel').BookModel} BookModel */
/** @typedef {import('./BookModel').PageModel} PageModel */
/** @typedef {import('./PageContainer').PageContainer} PageContainer */
/** @typedef {import('../BookReader').default} BookReader */

// I _have_ to make this globally public, otherwise it won't let me call
// it's constructor :/
@customElement('br-mode-1up')
export class Mode1UpLit extends CachedDimensionsMixin(LitElement) {
  @property({ type: Number })
  scale = 1;

  /** @type {PageModel[]} */
  @property({ type: Array })
  renderedPages = [];

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

  visibleRegion = {
    top: 0,
    left: 0,
    width: 100,
    height: 100,
  };
  /** @type {PageModel[]} */
  visiblePages = []
  /** @type {{ [pageIndex: string]: PageContainer}} position in inches */
  pageContainerCache = {};

  /** Vertical space between/around the pages in inches */
  spacingInches = 0.2;

  /**
   * @param {BookModel} book
   * @param {BookReader} br
   */
  constructor(book, br) {
    super();

    /** @type {BookModel} */
    this.book = book;
    /** @type {BookReader} */
    this.br = br;

    /** @type {PageModel[]} */
    this.pages = genToArray(this.book.pagesIterator({ combineConsecutiveUnviewables: true }));

    /** @type {{ [pageIndex: string]: { top: number }}} position in inches */
    this.pagePositions = (() => {
      /** @type {{ [pageIndex: string]: { top: number }}} */
      const result = {};
      let top = this.spacingInches;
      for (const page of this.pages) {
        result[page.index] = { top };
        top += page.heightInches + this.spacingInches;
      }
      return result;
    })();

    this.world = {
      width: Math.max(...this.pages.map(p => p.widthInches)) + 2 * this.spacingInches,
      height:
          sum(this.pages.map(p => p.heightInches)) +
          (this.pages.length + 1) * this.spacingInches,
    };
  }

  // Disable shadow DOM; that would require a huge rejiggering of CSS
  createRenderRoot() {
    return this;
  }

  /** @type {HTMLElement} */
  @query('.br-mode-1up__world')
  $world;

  /** @type {HTMLElement} */
  @query('.br-mode-1up__visibleWorld')
  $visibleWorld;

  // guard, cache
  get worldStyle() {
    const wToR = this.worldUnitsToRenderedPixels;
    return {
      width: wToR(this.world.width) + "px",
      height: wToR(this.world.height) + "px",
    };
  }

  jumpToIndex(index) {
    this.scrollTop = this.worldUnitsToVisiblePixels(this.pagePositions[index].top);
  }

  /** COORDINATE SPACE CONVERSIONS */

  /**
   * Should only be used for rendering; all computations should be done in world space.
   */
  worldUnitsToRenderedPixels = (inches, reduce = this.realWorldReduce, screenDPI = this.screenDPI) => {
    return inches * screenDPI / reduce;
  }

  /**
   * Inverse of the above
   * @param {number} px
   */
  renderedPixelsToWorldUnits = (px, reduce = this.realWorldReduce, screenDPI = this.screenDPI) => {
    return px * reduce / screenDPI;
  }

  /**
   * Takes into account CSS transform scale
   * @param {number} px
   */
  renderedPixelsToVisiblePixels = (px, scale = this.scale) => {
    return px * scale;
  }

  /**
   * @param {number} px
   */
  visiblePixelsToRenderedPixels = (px, scale = this.scale) => {
    return px / scale;
  }

  /**
   * Helper of the two expected functions
   * @param {number} px
   */
  worldUnitsToVisiblePixels = (px) => {
    return this.renderedPixelsToVisiblePixels(
      this.worldUnitsToRenderedPixels(px)
    );
  }

  /**
   * @param {number} px
   */
  visiblePixelsToWorldUnits = (px) => {
    return this.renderedPixelsToWorldUnits(
      this.visiblePixelsToRenderedPixels(px)
    );
  }

  /**
   * @param {PageModel} page
   */
  pageStyle = (page) => {
    const r = this.worldUnitsToRenderedPixels;
    return {
      width: r(page.widthInches),
      height: r(page.heightInches),
      transform: `translate(0px, ${r(this.pagePositions[page.index].top)}px)`,
    };
  }

  /**
   * @param {PageModel} page
   */
  createPageContainer = (page) => {
    return this.pageContainerCache[page.index] || (
      this.pageContainerCache[page.index] = (
        // @ts-ignore I know it's protected, TS! But Mode1Up and BookReader are friends.
        this.br._createPageContainer(page.index)
      )
    );
  }

  /**
   * @param {PageModel} page
   */
  renderPage = (page) => {
    const pageStyle = this.pageStyle(page);
    const el = this.createPageContainer(page)
      .update({
        dimensions: {
          width: pageStyle.width,
          height: pageStyle.height,
          top: 0,
          left: 10,
        },
        reduce: 8,
      }).$container[0];

    el.style.transform = pageStyle.transform;
    return el;
  }

  render() {
    return html`
      <div class="br-mode-1up__world" style=${styleMap(this.worldStyle)}></div>
      <div class="br-mode-1up__visible-world">
        ${this.renderedPages.map(p => this.renderPage(p))}
      </div>`;
  }

  /** @override */
  firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this.updateVisibleRegion();
    this.updateRenderedPages();

    this.attachExpensiveListeners();
  }

  attachExpensiveListeners = () => {
    window.addEventListener("wheel", this.handleCtrlWheel, { passive: false });
    this.addEventListener("scroll", this.handleScroll, { passive: true });
  }

  detachExpensiveListeners = () => {
    window.removeEventListener("wheel", this.handleCtrlWheel);
    this.removeEventListener("scroll", this.handleScroll);
  }

  handleScroll = () => {
    this.updateVisibleRegion();
    this.throttledUpdateRenderedPages();
  }

  /** @override */
  disconnectedCallback() {
    this.detachExpensiveListeners();
    super.disconnectedCallback();
  }

  /** WHAT'S VISIBLE */

  updateVisibleRegion = () => {
    const { scrollTop, scrollLeft } = this;
    // clientHeight excludes scrollbars, which is good.
    const clientWidth = this.containerClientWidth;
    const clientHeight = this.containerClientHeight;

    // Note: scrollTop, and clientWidth all are in visible space;
    // i.e. they are affects by the CSS transforms.

    const vToW = this.visiblePixelsToWorldUnits;
    this.visibleRegion.top = vToW(scrollTop);
    this.visibleRegion.height = vToW(clientHeight);
    // TODO: These are very likely wrong
    this.visibleRegion.left = vToW(scrollLeft);
    this.visibleRegion.width = vToW(clientWidth);
  }

  updateRenderedPages = () => {
    console.log("updateRenderedPages");
    this.pagesNowVisible = this.pages.filter(page => {
      const PT = this.pagePositions[page.index].top;
      const PB = PT + page.heightInches;

      const VT = this.visibleRegion.top;
      const VB = VT + this.visibleRegion.height;
      return PT <= VB && PB >= VT;
    });

    if (this.pagesNowVisible[0] === this.visiblePages[0] && this.pagesNowVisible.length == this.visiblePages.length) {
      // No change! Get out while you still can!
      return;
    }
    this.visiblePages = this.pagesNowVisible;

    // Also render 1 page before/after
    // @ts-ignore TS doesn't understand the filtering out of null values
    this.renderedPages = [
      this.visiblePages[0].prev,
      ...this.visiblePages,
      this.visiblePages[this.visiblePages.length - 1].next,
    ]
      .filter(p => p)
      // Never render more than 10 pages! Usually means something is wrong
      .slice(0, 10);
  }

  throttledUpdateRenderedPages = throttle(this.updateRenderedPages, 100, null)

  /**
   * @param {WheelEvent} ev
   */
  handleCtrlWheel = (ev) => {
    if (!ev.ctrlKey) return;
    ev.preventDefault();
    const zoomMultiplier =
        // Zooming on macs was painfully slow; likely due to their better
        // trackpads. Give them a higher zoom rate.
        /Mac/i.test(navigator.platform)
          ? 0.045
          : // This worked well for me on Windows
          0.015;

    // Zoom around the cursor
    // this.updateTransformCenter(ev);
    this.scale *= 1 - Math.sign(ev.deltaY) * zoomMultiplier;
  }

  /** @override */
  // update(changedProps) {
  //   // this.X is the new value
  //   // changedProps.get('X') is the old value
  //   if (changedProps.has('book')) {
  //     this.pages = null; // ...
  //   }
  //   if (changedProps.has('pages')) {
  //     this.pages = null; // ...
  //   }
  // }
}

/**
 * Computing these things repeatedly is expensive (the browser needs to
 * do a lot of computations/redrawing to make sure these are correct),
 * so we store them here, and only recompute them when necessary:
 * - window resize could have cause the container to change size
 * - zoom could have cause scrollbars to appear/disappear, changing
 *   the client size.
 * @param {typeof LitElement} superClass
 */
function CachedDimensionsMixin(superClass) {
  return class CachedDimensionsMixin extends superClass {
    containerClientWidth = 100;
    containerClientHeight = 100;
    containerBoundingClient = { top: 0, left: 0 };

    /** @override */
    firstUpdated(changedProps) {
      super.firstUpdated(changedProps);
      this.updateClientSizes();
    }

    updateClientSizes = () => {
      const bc = this.getBoundingClientRect();
      this.containerClientWidth = this.clientWidth;
      this.containerClientHeight = this.clientHeight;
      this.containerBoundingClient.top = bc.top;
      this.containerBoundingClient.left = bc.left;
    }
    debouncedUpdateClientSizes = debounce(this.updateClientSizes, 150, false);

    /** @override */
    connectedCallback() {
      super.connectedCallback();
      window.addEventListener('resize', this.debouncedUpdateClientSizes);
    }

    /** @override */
    disconnectedCallback() {
      window.removeEventListener('resize', this.debouncedUpdateClientSizes);
      super.disconnectedCallback();
    }
  };
}
