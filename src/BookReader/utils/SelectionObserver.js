// @ts-check
export class SelectionObserver {
  selecting = false;
  startedInSelector = false;
  /** @type {HTMLElement} */
  target = null;
  /** @type {string} */
  lastKnownSelectionText = '';

  /**
   * @param {string} selector
   * @param {function('started' | 'cleared' | 'changed', HTMLElement): any} handler
   */
  constructor(selector, handler) {
    this.selector = selector;
    this.handler = handler;
  }

  attach() {
    // We can't just use selectstart, because safari on iOS just
    // randomly decides when to fire it 😤
    // document.addEventListener("selectstart", this._onSelectStart);
    // This has to be on document :/
    document.addEventListener("selectionchange", this._onSelectionChange);
  }

  detach() {
    document.removeEventListener("selectionchange", this._onSelectionChange);
  }

  _onSelectionChange = () => {
    const sel = window.getSelection();
    if (!sel) return;

    if (!this.selecting && sel.toString()) {
      const target = $(sel.anchorNode).closest(this.selector)[0];
      if (!target) return;
      this.target = target;
      this.selecting = true;
      this.lastKnownSelectionText = sel.toString();
      this.handler('started', this.target);
    }

    if (this.selecting && sel.toString() !== this.lastKnownSelectionText) {
      this.lastKnownSelectionText = sel.toString();
      this.handler('changed', this.target);
    }

    if (this.selecting && (sel.isCollapsed || !sel.toString() || !$(sel.anchorNode).closest(this.selector)[0])) {
      this.selecting = false;
      this.handler('cleared', this.target);
    }
  };
}
