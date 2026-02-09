// @ts-check
export class SelectionObserver {
  selecting = false;
  startedInSelector = false;
  /** @type {HTMLElement} */
  target = null;
  lastKnownFocusNode = null;

  /**
   * @param {string} selector
   * @param {function('started' | 'cleared' | 'focusChanged', HTMLElement): any} handler
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

    if (!this.selecting && sel.toString()) {
      const target = $(sel.anchorNode).closest(this.selector)[0];
      if (!target) return;
      this.target = target;
      this.selecting = true;
      this.lastKnownFocusNode = sel.focusNode;
      this.handler('started', this.target);
    }

    if (this.selecting && (this.lastKnownFocusNode != sel.focusNode || sel.toString())) {
      this.lastKnownFocusNode = sel.focusNode;
      this.handler('focusChanged', this.target);
    }

    if (this.selecting && (sel.isCollapsed || !sel.toString() || !$(sel.anchorNode).closest(this.selector)[0])) {
      this.selecting = false;
      this.handler('cleared', this.target);
    }
  };
}
