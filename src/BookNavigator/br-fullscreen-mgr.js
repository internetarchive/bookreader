import Debouncer from '../util/debouncer';

/**
 * Manages fullscreen size
 * so that bookreader chrome is always visible
 * This is a shim to hold us until we update loan bar
 * https://drive.google.com/drive/folders/1Ym9FDMZPiM4EbNh3NU-_2h8kizIYaLWt
 */
export default class BRFullscreenMgr {
  constructor() {
    this.debounceTime = 250;
    this.setup = this.setup.bind(this);
    this.teardown = this.teardown.bind(this);
    this.resizeBookReaderContainer = this.resizeBookReaderContainer.bind(this);
    this.handleResizeEvent = this.handleResizeEvent.bind(this);
    this.handleBookReaderHeight = new Debouncer(
      this.resizeBookReaderContainer, this.debounceTime, this,
    );
    this.savedScrollY = 0;
    this.savedScrollX = 0;
  }

  /**
   * Sets bookreader height
   * & adds resize, orientationchange listeners
   * & passes captured scroll positions
   *
   * @param {number} scrollX
   * @param {number} scrolly
   */
  setup(scrollX = 0, scrollY = 0) {
    // set given scroll positions
    this.savedScrollX = scrollX;
    this.savedScrollY = scrollY

    this.resizeBookReaderContainer();
    window.addEventListener('resize', this.handleResizeEvent);
  }

  /**
   * Resets BookReader height
   * & removes event handlers, resets captured scroll positions
   */
  teardown() {
    const bookreader = document.querySelector('#BookReader');
    bookreader.setAttribute('style', '');
    window.removeEventListener('resize', this.handleResizeEvent);
    window.scrollTo(this.savedScrollX, this.savedScrollY);
    this.savedScrollX = 0;
    this.savedScrollY = 0;
  }

  /**
   * Event listener for resize & orientationchange
   */
  handleResizeEvent() {
    this.handleBookReaderHeight.execute();
  }

  /**
   * Calculates & sets BookReader's needed height to
   * take the loan bar into account
   */
  // eslint-disable-next-line class-methods-use-this
  resizeBookReaderContainer() {
    const loanbar = document.querySelector('.BookReaderMessage');
    const bookreader = document.querySelector('#BookReader');
    const loanbarHeight = loanbar?.offsetHeight ?? 0;
    const windowHeight = window.innerHeight;
    const newHeight = `${(windowHeight - loanbarHeight)}px`;
    bookreader.style.height = newHeight;
    window.scrollTo(0, 0);
  }
}
