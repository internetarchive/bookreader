// @ts-check
import { EVENTS } from "../BookReader/events.js";
import { parseAnimationSpeed } from "../BookReader/utils.js";
import { BookReaderPlugin } from "../BookReaderPlugin.js";

/**
 * Plugin which adds an autoplay feature. Useful for kiosk situations.
 */
export class AutoplayPlugin extends BookReaderPlugin {
  options = {
    enabled: true,
    /**
     * @type {number | 'fast' | 'slow'}
     * How quickly the flip animation should run.
     **/
    flipSpeed: 1500,
    /** How long to pause on each page between flips */
    flipDelay: 5000,
    /** Allow controlling the autoflip/speed/delay from the url */
    urlParams: true,
  }

  timer = null;

  /** @override */
  init() {
    if (!this.options.enabled) return;

    this.br.bind(EVENTS.stop, () => this.stop());

    if (this.options.urlParams) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('flipSpeed')) {
        this.options.flipSpeed = parseAnimationSpeed(urlParams.get('flipSpeed')) || this.options.flipSpeed;
      }
      if (urlParams.get('flipDelay')) {
        this.options.flipDelay = parseAnimationSpeed(urlParams.get('flipDelay')) || this.options.flipDelay;
      }
      if (urlParams.get('autoflip') === '1') {
        this.toggle();
      }
    }
  }

  /** @override */
  _bindNavigationHandlers() {
    if (!this.options.enabled) return;

    const jIcons = this.br.$('.BRicon');

    jIcons.filter('.play').on('click', () => {
      this.toggle();
      return false;
    });

    jIcons.filter('.pause').on('click', () => {
      this.toggle();
      return false;
    });
  }

  /**
   * Starts autoplay mode
   * @param {object} overrides
   * @param {number} overrides.flipSpeed
   * @param {number} overrides.flipDelay
   */
  toggle(overrides = null) {
    if (!this.options.enabled) return;

    Object.assign(this.options, overrides);
    this.br.trigger(EVENTS.stop);

    let bComingFrom1up = false;
    if (this.br.constMode2up != this.br.mode) {
      bComingFrom1up = true;
      this.br.switchMode(this.br.constMode2up);
    }

    if (null == this.timer) {
      // $$$ Draw events currently cause layout problems when they occur during animation.
      //     There is a specific problem when changing from 1-up immediately to autoplay in RTL so
      //     we workaround for now by not triggering immediate animation in that case.
      //     See https://bugs.launchpad.net/gnubook/+bug/328327
      if (('rl' == this.br.pageProgression) && bComingFrom1up) {
        // don't flip immediately -- wait until timer fires
      } else {
        // flip immediately
        this.br.next({ triggerStop: false, flipSpeed: this.options.flipSpeed });
      }

      this.br.$('.play').hide();
      this.br.$('.pause').show();
      this.timer = setInterval(() => {
        if (this.br.animating) return;

        if (Math.max(this.br.twoPage.currentIndexL, this.br.twoPage.currentIndexR) >= this.br.book.getNumLeafs() - 1) {
          this.br.prev({ triggerStop: false, flipSpeed: this.options.flipSpeed }); // $$$ really what we want?
        } else {
          this.br.next({ triggerStop: false, flipSpeed: this.options.flipSpeed });
        }
      }, parseAnimationSpeed(this.options.flipDelay));
    } else {
      this.stop();
    }
  }

  /**
   * Stop autoplay mode, allowing animations to finish
   */
  stop() {
    if (!this.options.enabled) return;

    if (null != this.timer) {
      clearInterval(this.timer);
      this.br.$('.pause').hide();
      this.br.$('.play').show();
      this.timer = null;
    }
  }
}

const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);
BookReader?.registerPlugin('autoplay', AutoplayPlugin);
