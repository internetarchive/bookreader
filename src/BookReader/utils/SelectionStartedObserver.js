// @ts-check
export class SelectionStartedObserver {
  loggedForSelection = false;
  startedInSelector = false;

  /**
   * @param {string} selector
   * @param {function(): any} handler
   */
  constructor(selector, handler) {
    this.selector = selector;
    this.handler = handler;
  }

  attach() {
    // We can't just use select start, because Chrome fires that willy
    // nilly even when a user slightly long presses.
    document.addEventListener("selectstart", this._onSelectStart);
    // This has to be on document :/
    document.addEventListener("selectionchange", this._onSelectionChange);
  }

  detach() {
    document.removeEventListener("selectstart", this._onSelectStart);
    document.removeEventListener("selectionchange", this._onSelectionChange);
  }

  /**
   * @param {Event} ev
   */
  _onSelectStart = (ev) => {
    this.loggedForSelection = false;
    // Use jQuery because ev.target could be a Node (eg TextNode), which
    // doesn't have .closest on it.
    this.startedInSelector = $(ev.target).closest(this.selector).length > 0;
  };

  _onSelectionChange = () => {
    if (this.loggedForSelection || !this.startedInSelector) return;
    const sel = window.getSelection();
    if (sel.toString()) {
      this.loggedForSelection = true;
      this.handler();
    }
  };
}
