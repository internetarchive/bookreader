// @ts-check
import { customElement, property } from 'lit/decorators.js';
import { Mode1UpLit } from "./Mode1UpLit";
import { sleep } from './utils';
/** @typedef {import('./BookModel').PageIndex} PageIndex */
/** @typedef {import('./BookModel').PageModel} PageModel */

@customElement('br-mode-text')
export class ModeTextLit extends Mode1UpLit {
  /**
   * Whereas `pageTops` from `Mode1UpLit` is the position of the
   * physical pages, because when we render the pages as text we
   * do not know the exact height of the text until after we render
   * it, the values in `pageTaps` are essentially "estimates". The
   * _actual_ positions are stored in `actualPositions` as the
   * pages are rendered.
   * @type {Record<PageIndex, {top?: number, bottom?: number}>} in pixels
   **/
  @property({ type: Object })
  actualPositions = {};

  // override to prevent scale from being set
  get scale() { return 1; }
  set scale(value) {
    // ignore
  }

  BUFFER_AROUND = 5;
  SPACING_IN = 0;

  /** @override */
  updated(changedProps) {
    if (changedProps.has('pages')) {
      this.actualPositions = {
        0: { top: 0 }
      };
    }
    if (changedProps.has('renderedPages')) {
      // debugger;
      this.updateComplete
        .then(() => Promise.all(this.visiblePages.map(p => this.pageContainerCache[p.index].textSelectionLoadingComplete)))
        .then(() => {
          // Note the exact tops of the rendered pages
          this.updateActualPositions(this.visiblePages);
        });
    }

    super.updated(changedProps);
  }

  /**
   * @param {PageModel[]} pages
   */
  updateActualPositions(pages) {
    const wToR = this.coordSpace.worldUnitsToRenderedPixels;
    let changed = false;
    for (const p of pages) {
      let pos = this.actualPositions[p.index];
      /** @type {DOMRect} */
      let rect = null;
      /** @type {PageModel | void} */
      let prev = null;
      /** @type {PageModel | void} */
      let next = null;

      let setBottom = false;
      let setTop = false;

      if (pos) {
        if (typeof pos.bottom === 'undefined') {
          rect ||= this.pageContainerCache[p.index].$container[0].getBoundingClientRect();
          pos.bottom = pos.top + rect.height;
          setBottom = true;
          changed = true;
        }

        if (typeof pos.top === 'undefined') {
          rect ||= this.pageContainerCache[p.index].$container[0].getBoundingClientRect();
          pos.top = pos.bottom - rect.height;
          setTop = true;
          changed = true;
        }
      } else {
        rect ||= this.pageContainerCache[p.index].$container[0].getBoundingClientRect();
        pos = this.actualPositions[p.index] = {
          top: rect.top,
          bottom: rect.bottom,
        };
        setTop = setBottom = true;
        changed = true;
      }

      // Also set the top of the next page
      if (setBottom) {
        next ||= p.findNext({ combineConsecutiveUnviewables: true });
        if (next) {
          this.actualPositions[next.index] ||= {};
          this.actualPositions[next.index].top = pos.bottom + wToR(this.SPACING_IN);
          // this.pageTops[next.index] = this.actualPositions[next.index].top;
          changed = true;
        }
      }

      if (setTop) {
        // const rToW = this.coordSpace.renderedPixelsToWorldUnits;
        // this.computePageTops(this.pages.filter(p2 => p2.index >= p.index), this.SPACING_IN, rToW(pos.top), this.pageTops);

        prev ||= p.findPrev({ combineConsecutiveUnviewables: true });
        if (prev) {
          this.actualPositions[prev.index] ||= {};
          this.actualPositions[prev.index].bottom = pos.top - wToR(this.SPACING_IN);
          changed = true;
        }
      }
    }

    if (changed) {
      this.requestUpdate('actualPositions');
    }
  }

  getPageTransform(page) {
    if (page.index in this.actualPositions && typeof this.actualPositions[page.index].top !== 'undefined') {
      return `translate(0, ${this.actualPositions[page.index].top}px)`;
    } else {
      const transform = super.getPageTransform(page);
      // ignore the x translation
      return transform.replace(/translate\(\s*[^,]+,\s*([^,]+)\)/, 'translate(0, $1)');
    }
  }

  /**
   * @override
   * @param {PageModel} page
   */
  renderPage(page) {
    const pageContainerEl = super.renderPage(page);
    pageContainerEl.classList.toggle('BRpage-visible', true);
    return pageContainerEl;
  }

  /** @overload */
  isPageVisible(page) {
    if (page.index in this.actualPositions) {
      const pToW = this.coordSpace.renderedPixelsToWorldUnits;
      const region = this.actualPositions[page.index];
      const VT = this.visibleRegion.top;
      const VB = VT + this.visibleRegion.height;
      // top or bottom could be undefined
      const PT = pToW(typeof region.top === 'undefined' ? region.bottom - 80 : region.top);
      const PB = pToW(typeof region.bottom === 'undefined' ? region.top + 80 : region.bottom);
      return (PT <= VB && PB >= VT) || (PT <= VB && PT >= VT) || (PB >= VT && PB <= VB);
    } else {
      return super.isPageVisible(page);
    }
  }

  /**
   * @param {PageIndex} index
   */
  jumpToIndex(index, { smooth = false } = {}) {
    if (smooth) {
      this.style.scrollBehavior = 'smooth';
    }
    this.scrollTop = this.actualPositions[index]?.top ?? this.coordSpace.worldUnitsToVisiblePixels(this.pageTops[index] - this.SPACING_IN / 2);
    // TODO: Also h center?
    if (smooth) {
      setTimeout(() => this.style.scrollBehavior = '', 100);
    }
  }
}
