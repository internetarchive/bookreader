// @ts-check
import { eventFilterMouseMove } from '../BookReader/utils.js';

/**
 * Hides the BookReader chrome when the user is not using it; eg when
 * they are scrolling down through the book, and haven't touched anything in a while.
 */
export class ChromeFader {
    /** @type {string | null} */
    ignoreClickOnSelector = null;

    /** @type {string | null} */
    ignorePointerMoveOnSelector = null;

    /** @type {string | null} */
    ignorePointerLeaveOnSelector = null;

    /** @type {string | null} */
    ignoreOutsidePointerDownOnSelector = null;

    isShowing = true;

    /** @type {HTMLElement} */
    _scrollElement;

    /** @type {ReturnType<typeof setTimeout> | null} */
    _hideTimeout = null;

    /** Pixels of scroll needed to go from fully hidden↔shown */
    _scrollShowDistance = 80;
    _lastScrollTop = 0;
    _scrollUpAccum = 0;
    _scrollDownAccum = 0;

    /** @type {(...args: any[]) => void} */
    log = () => {};

    /**
     * @param {HTMLElement} scrollElement
     */
    constructor(scrollElement) {
      this._scrollElement = scrollElement;
      this.isShowing = !document.body.classList.contains('BRfaded');
      if (new URLSearchParams(location.search).get('debug') === 'true') {
        this.log = console.log.bind(console);
      }
    }

    attach() {
      this.log('ScrollFader attach');
      this.modeAwake();
    }

    detach() {
      this.log('ScrollFader detach');
      this._scrollElement.removeEventListener('pointerleave', this._handlePointerLeave);
      document.removeEventListener('pointerdown', this._handleOutsidePointerDown, { capture: true });
      this._scrollElement.removeEventListener('pointermove', this._handlePointerMove);
      this._scrollElement.removeEventListener('scroll', this._handleScroll);
      this._scrollElement.removeEventListener('touchstart', this._handleTouchStart);
      this._scrollElement.removeEventListener('click', this._handleClick);
      this._scrollElement.removeEventListener('pointerenter', this.modeAwake);

      if (this._hideTimeout) {
        clearTimeout(this._hideTimeout);
        this._hideTimeout = null;
      }

      $(document.body).removeClass('BRfaded');
      document.body.style.removeProperty('--br-fade-progress');
      this.isShowing = true;
    }

    /** @param {HTMLElement} el */
    changeScrollElement(el) {
      this.detach();
      this._scrollElement = el;
    }

    /**
     * In this mode, the events are monitored and the UI is auto-hidden when not
     * interacted with.
     *
     * We transition to modeInactive when the user leaves the scrollElement -- in
     * this case, leave BookReader, or starts interacting with the chrome itself.
     */
    modeAwake = () => {
      this.log('ScrollFader modeAwake', this._scrollElement);
      this.detach();
      this.keepShowing('modeAwake');
      this._scrollElement.addEventListener('pointerleave', this._handlePointerLeave);
      document.addEventListener('pointerdown', this._handleOutsidePointerDown, { capture: true, passive: true });
      this._scrollElement.addEventListener('pointermove', this._handlePointerMove, { passive: true });
      this._scrollElement.addEventListener('scroll', this._handleScroll, { passive: true });
      this._scrollElement.addEventListener('touchstart', this._handleTouchStart, { passive: true });
      this._scrollElement.addEventListener('click', this._handleClick, { passive: true });
    }

    modeInactive = () => {
      this.log('ScrollFader modeInactive');
      this.detach();
      this.show('modeInactive');
      this._scrollElement.addEventListener('pointerenter', this.modeAwake, { once: true });
    }

    /** @param {PointerEvent} ev */
    _handlePointerLeave = (ev) => {
      if (ev.pointerType === 'touch') return;
      if (this.ignorePointerLeaveOnSelector && /** @type {Element} */ (ev.relatedTarget)?.closest(this.ignorePointerLeaveOnSelector)) return;
      this.log('ScrollFader pointerleave');
      this.modeInactive();
    }

    /** @param {PointerEvent} ev */
    _handleOutsidePointerDown = (ev) => {
      if (this._scrollElement.contains(/** @type {Node} */ (ev.target))) return;
      if (this.ignorePointerLeaveOnSelector && ev.target.closest(this.ignorePointerLeaveOnSelector)) return;
      if (this.ignoreOutsidePointerDownOnSelector && /** @type {Element} */ (ev.target)?.closest(this.ignoreOutsidePointerDownOnSelector)) return;
      this.log('ScrollFader outside pointerdown');
      this.modeInactive();
    }
    _handlePointerMove = (ev) => {
      const pev = /** @type {PointerEvent} */ (ev);
      if (pev.pointerType === 'touch') return;

      const distFromBottom = window.innerHeight - pev.clientY;
      const distFromLeft = pev.clientX;
      const edgeProgress = Math.max(
        distFromBottom <= 150 ? Math.min(1, (150 - distFromBottom) / 70) : 0,
        distFromLeft <= 150 ? Math.min(1, (150 - distFromLeft) / 70) : 0,
      );
      if (edgeProgress > 0) {
        document.body.style.setProperty('--br-fade-progress', String(edgeProgress));
        if (edgeProgress >= 1) this.keepShowing('pointermove-edge');
        return;
      }

      // if (this.ignorePointerMoveOnSelector && /** @type {Element} */ (pev.target)?.closest(this.ignorePointerMoveOnSelector)) return;
      // this.keepShowing('pointermove');
    };
    _handleScroll = () => {
      const st = this._scrollElement.scrollTop;
      if (st < this._lastScrollTop) {
        this._scrollUpAccum += this._lastScrollTop - st;
        const progress = Math.min(this._scrollUpAccum / this._scrollShowDistance, 1);
        document.body.style.setProperty('--br-fade-progress', String(progress));
        if (progress >= 1) this.keepShowing('scroll');
      } else {
        this._scrollUpAccum = 0;
      }
      this._lastScrollTop = st;
    }
    /** @param {TouchEvent} ev */
    _handleTouchStart = (ev) => ev.target === ev.currentTarget && this.keepShowing('touchstart');

    /** @param {MouseEvent} ev */
    _handleClick = (ev) => {
      if (window.getSelection()?.toString()) return; // don't toggle when selecting
      if (this.ignoreClickOnSelector && ev.target.closest(this.ignoreClickOnSelector)) return;
      this.keepShowing('click');
    };

    /**
     * @param {string} source debug source of the event that triggered this
     */
    keepShowing = (source) => {
      this.log('Show UI ...', source);
      if (!this.isShowing) this.show(source);
      if (this._hideTimeout) clearTimeout(this._hideTimeout);
      this._hideTimeout = setTimeout(() => {
        this._hideTimeout = null;
        this.hide(source);
      }, 2000);
    };

    /**
     * @param {string} source debug source of the event that triggered this
     */
    show = (source) => {
      this.log('Show UI ...', source);
      this.isShowing = true;
      $(document.body).removeClass('BRfaded');
    };

    /**
     * @param {string} source debug source of the event that triggered this
     */
    hide = (source) => {
      this.log('Hide UI ...', source);
      this.isShowing = false;
      this._scrollUpAccum = 0;
      this._lastScrollTop = this._scrollElement.scrollTop;
      document.body.style.setProperty('--br-fade-progress', '0');
      $(document.body).addClass('BRfaded');
    };
}
