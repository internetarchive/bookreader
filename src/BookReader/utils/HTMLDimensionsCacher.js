// @ts-check
import { debounce } from '../utils.js';

/**
 * Computing these things repeatedly is expensive (the browser needs to
 * do a lot of computations/redrawing to make sure these are correct),
 * so we store them here, and only recompute them when necessary:
 * - window resize could have cause the container to change size
 * - zoom could have cause scrollbars to appear/disappear, changing
 *   the client size.
 */
export class HTMLDimensionsCacher {
  clientWidth = 100;
  clientHeight = 100;

  boundingClientRect = { top: 0, left: 0 };

  /**
   * @param {HTMLElement} element
   */
  constructor(element) {
    /** @type {HTMLElement} */
    this.element = element;
  }

  updateClientSizes = () => {
    const bc = this.element.getBoundingClientRect();
    this.clientWidth = this.element.clientWidth;
    this.clientHeight = this.element.clientHeight;
    this.boundingClientRect.top = bc.top;
    this.boundingClientRect.left = bc.left;
  }
  debouncedUpdateClientSizes = debounce(this.updateClientSizes, 150, false);

  /** @param {EventTarget} win */
  attachResizeListener(win = window) {
    win.addEventListener('resize', this.debouncedUpdateClientSizes);
  }

  /** @param {EventTarget} win */
  detachResizeListener(win = window) {
    win.removeEventListener('resize', this.debouncedUpdateClientSizes);
  }
}
