// @ts-check

/**
 * Hides the BookReader chrome when the user is not using it; eg when
 * they are scrolling down through the book, and haven't touched anything in a while.
 */
export class ChromeFader {
    /**
     * @type {string | null}
     * Selector for clickable elements of the content. Clicking won't
     * trigger showing the chrome to stay immersive, but clicking will
     * *hide* the chrome if it is locked into showing -- basically
     * clicking on these is considered "entering" the content
     */
    clickableContentSelector = null;

    /**
     * @type {string | null}
     * If the pointer leaves the container onto elements matching this CSS selector, it
     * will not trigger showing the chrome
     */
    ignorePointerLeaveOnSelector = null;

    /** @type {string | null} */
    ignoreOutsidePointerDownOnSelector = null;

    /** Whether the chrome is currently visible */
    isShowing = true;

    /**
     * If chrome was shown via an explicit click/tap, it should stay shown
     * until the user taps or scrolls again, instead of auto-hiding on the
     * usual inactivity timer.
     */
    _lockedShowing = false;

    /**
     * @type {HTMLElement}
     * The element we will be monitoring for the scroll-triggered showing/hiding
     */
    _scrollElement;

    /** @type {ReturnType<typeof setTimeout> | null} */
    _hideTimeout = null;

    /** Pixels of scroll needed to go from fully hidden↔shown */
    _scrollShowDistance = 80;
    _lastScrollTop = 0;
    /** Current scroll-driven reveal progress, from 0 (hidden) to 1 (shown) */
    _scrollFadeProgress = 0;

    /**
     * Whether there was a text selection when the pointer went down. A plain click
     * collapses any selection on pointerdown, before the click event fires, so by
     * click time `getSelection()` alone can no longer tell us the user was clicking
     * to clear a selection rather than to toggle the chrome.
     */
    _hadSelectionOnPointerDown = false;

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
      this._scrollElement.removeEventListener('pointerdown', this._handlePointerDown);
      this._scrollElement.removeEventListener('scroll', this._handleScroll);
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
      this._scrollElement.addEventListener('pointerdown', this._handlePointerDown, { passive: true });
      this._scrollElement.addEventListener('scroll', this._handleScroll, { passive: true });
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
    };

    _handlePointerDown = () => {
      this._hadSelectionOnPointerDown = !!window.getSelection()?.toString();
    };

    _handleScroll = () => {
      const st = this._scrollElement.scrollTop;
      const delta = this._lastScrollTop - st; // positive: scrolled up, negative: scrolled down
      this._lastScrollTop = st;

      if (this.isShowing) {
        if (this._lockedShowing) {
          // Scroll unlocks it, reverting to normal auto-hide, without hiding immediately.
          if (delta !== 0) {
            this._lockedShowing = false;
            this.keepShowing('scroll');
          }
          return;
        }
        // Already fully shown; a scroll-up just resets the hide timer, same as before.
        if (delta > 0) this.keepShowing('scroll');
        return;
      }

      if (delta === 0) return;

      this._scrollFadeProgress = Math.min(1, Math.max(0, this._scrollFadeProgress + delta / this._scrollShowDistance));

      if (this._scrollFadeProgress >= 1) {
        this.keepShowing('scroll');
      } else if (this._scrollFadeProgress <= 0) {
        // Scrolled back down through the whole reveal distance -- hide immediately.
        this.hide('scroll');
      } else {
        document.body.style.setProperty('--br-fade-progress', String(this._scrollFadeProgress));
        // Left mid-reveal; if nothing else happens, hide on the same timer as a normal hide.
        this._scheduleHide('scroll');
      }
    }
    /** @param {MouseEvent} ev */
    _handleClick = (ev) => {
      const hadSelection = this._hadSelectionOnPointerDown;
      this._hadSelectionOnPointerDown = false;
      if (hadSelection || window.getSelection()?.toString()) return; // don't toggle when (clearing a) selection
      if (
        !this._lockedShowing &&
        this.clickableContentSelector &&
        ev.target.closest(this.clickableContentSelector)
      ) return;

      if (this.isShowing) {
        this.hide('click');
      } else {
        this._lockedShowing = true;
        this.keepShowing('click');
      }
    };

    /**
     * @param {string} source debug source of the event that triggered this
     */
    keepShowing = (source) => {
      this.log('Show UI ...', source);
      if (!this.isShowing) this.show(source);
      this._scrollFadeProgress = 1;
      if (this._lockedShowing) return;
      this._scheduleHide(source);
    };

    /**
     * (Re)schedules a hide() after the standard delay, unless something else happens first.
     * @param {string} source debug source of the event that triggered this
     */
    _scheduleHide = (source) => {
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
      this._scrollFadeProgress = 0;
      this._lockedShowing = false;
      this._lastScrollTop = this._scrollElement.scrollTop;
      if (this._hideTimeout) {
        clearTimeout(this._hideTimeout);
        this._hideTimeout = null;
      }
      document.body.style.setProperty('--br-fade-progress', '0');
      $(document.body).addClass('BRfaded');
    };
}
