// @ts-check
/**
 * Like `Selection.isCollapsed`, but checks the ranges too. WebKit reports
 * `isCollapsed` as true for any selection inside a shadow root, even when
 * it has text.
 * https://bugs.webkit.org/show_bug.cgi?id=281587
 * @param {Selection} selection
 * @returns {boolean}
 */
export function isSelectionCollapsed(selection) {
  if (!selection.isCollapsed) return false;
  for (let i = 0; i < selection.rangeCount; i++) {
    if (!selection.getRangeAt(i).collapsed) return false;
  }
  return true;
}

export class SelectionObserver {
  selecting = false;
  startedInSelector = false;
  /** @type {HTMLElement} */
  target = null;
  /** @type {Node | null} */
  lastKnownFocusNode = null;

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
    const isCollapsed = isSelectionCollapsed(sel);

    if (!this.selecting && sel.toString()) {
      const target = $(sel.anchorNode).closest(this.selector)[0];
      if (!target) return;
      this.target = target;
      this.selecting = true;
      this.lastKnownFocusNode = sel.focusNode;
      this.handler('started', this.target);
    }

    if (this.selecting && this.lastKnownFocusNode != sel.focusNode && sel.toString() && !isCollapsed) {
      this.lastKnownFocusNode = sel.focusNode;
      this.handler('changed', this.target);
    }

    if (this.selecting && (isCollapsed || !sel.toString() || !$(sel.anchorNode).closest(this.selector)[0])) {
      this.selecting = false;
      this.lastKnownFocusNode = null;
      this.handler('cleared', this.target);
    }
  };
}
