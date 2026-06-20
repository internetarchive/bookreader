// @ts-check
import { eventFilterMouseMove, eventFilterScrollUp } from '../BookReader/utils.js';

/**
 * Hides the BookReader chrome when the user is not using it; eg when
 * they are scrolling down through the book, and haven't touched anything in a while.
 */
export class ChromeFader {
    /** @type {string | null} */
    ignoreClickOnSelector = null;

    /** @type {string | null} */
    ignorePointerLeaveOnSelector = null;

    isShowing = true;

    /** @type {HTMLElement} */
    _scrollElement;

    /** @type {ReturnType<typeof setTimeout> | null} */
    _hideTimeout = null;

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
      this.log('ScrollFader outside pointerdown');
      this.modeInactive();
    }
    /** @param {PointerEvent} ev */
    _handlePointerMove = eventFilterMouseMove(ev => ev.pointerType != 'touch' && this.keepShowing('pointermove'))
    /** @param {Event} ev */
    _handleScroll = eventFilterScrollUp(() => this.keepShowing('scroll'))
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
      $(document.body).addClass('BRfaded');
    };
}
