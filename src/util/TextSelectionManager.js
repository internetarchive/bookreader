// @ts-check
import { SelectionObserver } from "../BookReader/utils/SelectionObserver.js";
import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import '@internetarchive/icon-share';
import '@internetarchive/icon-edit-pencil/icon-edit-pencil.js';

const BR_HIGHLIGHTS_LOCAL_STORAGE_KEY = "BRhighlightStorage";
const MAX_FULL_QUOTE_URL_CHARS = 80;
const TRUNCATED_QUOTE_WORD_COUNT = 3;

export class TextSelectionManager {
  options = {
    // Current Translation plugin implementation does not have words, will limit to one BRlineElement for now
    maxProtectedWords: 200,
  }

  /** @type {BRSelectMenu} */
  selectMenu;

  get selectMenuEnabled() {
    return this.br.plugins.experiments?.isEnabled('copyLinkToHighlight') || this.br.plugins.experiments?.isEnabled('annotateHighlight');
  }

  /**
   * @param {string} layer Selector for the text layer to manage
   * @param {import('../BookReader.js').default} br
   * @param {Object} options
   * @param {string[]} options.selectionElement CSS selector for elements that count as "words" for selection limiting
   * @param {number} [maxWords] Maximum number of words allowed to be selected
   */
  constructor (layer, br, { selectionElement }, maxWords) {
    /** @type {string} */
    this.layer = layer;
    /** @type {import('../BookReader.js').default} */
    this.br = br;
    /** @type {string[]} */
    this.selectionElement = selectionElement;
    this.selectionObserver = new SelectionObserver(this.layer, this._onSelectionChange);
    this.options.maxProtectedWords = maxWords ? maxWords : 200;

    this.selectMenu = new BRSelectMenu(br);
    this.selectMenu.className = "br-select-menu__root";
  }

  init() {
    this.attach();
    new SelectionObserver(this.layer, (selectEvent) => {
      // Track how often selection is used
      if (selectEvent == 'started') {
        this.br.plugins.archiveAnalytics?.sendEvent('BookReader', 'SelectStart');

        // Set a class on the page to avoid hiding it when zooming/etc
        this.br.refs.$br.find('.BRpagecontainer--hasSelection').removeClass('BRpagecontainer--hasSelection');
        $(window.getSelection().anchorNode).closest('.BRpagecontainer').addClass('BRpagecontainer--hasSelection');
        this.showSelectMenu();

      }

      if (selectEvent == 'changed') {
        // hide the button as user changes their selection
        if (this.mouseIsDown) {
          this.hideSelectMenu();
        } else if (window.getSelection()?.toString()) {
          this.showSelectMenu();
        }
      }

      if (selectEvent == 'cleared') {
        this.hideSelectMenu();
      }
    }).attach();
  }

  // Need attach + detach methods to toggle w/ Translation plugin
  attach() {
    this.selectionObserver.attach();

    if (this.br.protected) {
      document.addEventListener('selectionchange', this._limitSelection);
      // Prevent right clicking when selected text
      $(document.body).on('contextmenu dragstart copy', (e) => {
        const selection = document.getSelection();
        if (selection?.toString()) {
          const intersectsTextLayer = $(this.layer)
            .toArray()
            .some(el => selection.containsNode(el, true));
          if (intersectsTextLayer) {
            e.preventDefault();
            return false;
          }
        }
      });
    }
  }

  detach() {
    this.selectionObserver.detach();
    if (this.br.protected) {
      document.removeEventListener('selectionchange', this._limitSelection);
    }
  }

  /**
   * @param {'started' | 'cleared' | 'changed'} type
   * @param {HTMLElement} target
   */
  _onSelectionChange = (type, target) => {
    if (type === 'started') {
      this.textSelectingMode(target);
    } else if (type === 'cleared') {
      this.defaultMode(target);
    } else if (type === 'changed') {
      // do nothing, just wait for the mouseup to trigger the styling change
    } else {
      throw new Error(`Unknown type ${type}`);
    }
  }

  /**
   * Intercept copied text to remove any styling applied to it
   * @param {JQuery} $container
   */
  interceptCopy ($container) {
    $container[0].addEventListener('copy', (event) => {
      const selection = document.getSelection();
      event.clipboardData.setData('text/plain', selection.toString());
      event.preventDefault();
    });
  }

  /**
   * Initializes text selection modes if there is a text layer on the page
   * @param {JQuery} $container
   */
  stopPageFlip($container) {
    /** @type {JQuery<HTMLElement>} */
    const $textLayer = $container.find(this.layer);
    if (!$textLayer.length) return;
    $textLayer.each((i, s) => this.defaultMode(s));
    if (!this.br.protected) {
      this.interceptCopy($container);
    }
  }

  /**
   * Applies mouse events when in default mode
   * @param {HTMLElement} textLayer
   */
  defaultMode (textLayer) {
    const $pageContainer = $(textLayer).closest('.BRpagecontainer');
    textLayer.style.pointerEvents = "none";
    $pageContainer.find("img").css("pointer-events", "auto");

    $(textLayer).off(".textSelectPluginHandler");
    const startedMouseDown = this.mouseIsDown;
    let skipNextMouseup = this.mouseIsDown;
    if (startedMouseDown) {
      textLayer.style.pointerEvents = "auto";
    }

    // Need to stop propagation to prevent DragScrollable from
    // blocking selection
    $(textLayer).on("mousedown.textSelectPluginHandler", (event) => {
      this.mouseIsDown = true;
      this.hideSelectMenu();
      if ($(event.target).is(this.selectionElement.join(", "))) {
        event.stopPropagation();
      }
    });

    $(textLayer).on("mouseup.textSelectPluginHandler", (event) => {
      this.mouseIsDown = false;
      this.hideSelectMenu();
      textLayer.style.pointerEvents = "none";
      if (skipNextMouseup) {
        skipNextMouseup = false;
        event.stopPropagation();
      }
    });
  }

  /**
   * This mode is active while there is a selection on the given textLayer
   * @param {HTMLElement} textLayer
   */
  textSelectingMode(textLayer) {
    const $pageContainer = $(textLayer).closest('.BRpagecontainer');
    // Make text layer consume all events
    textLayer.style.pointerEvents = "all";
    // Block img from getting long-press to save while selecting
    $pageContainer.find("img").css("pointer-events", "none");

    $(textLayer).off(".textSelectPluginHandler");

    $(textLayer).on("mousedown.textSelectPluginHandler", (event) => {
      if (event.which != 1) return;
      this.mouseIsDown = true;
      event.stopPropagation();
      this.hideSelectMenu();
    });

    // Prevent page flip on click
    $(textLayer).on('mouseup.textSelectPluginHandler', (event) => {
      this.mouseIsDown = false;
      if (event.which != 1) return;
      event.stopPropagation();
      this.showSelectMenu();
    });
  }

  showSelectMenu() {
    if (!this.selectMenuEnabled) return;

    this.selectMenu.copyLinkToHighlightEnabled = this.br.plugins.experiments.isEnabled('copyLinkToHighlight');
    this.selectMenu.highlightAnnotationEnabled = this.br.plugins.experiments.isEnabled('annotateHighlight');

    if (!this.selectMenu.isConnected) {
      document.body.append(this.selectMenu);
    }

    this.selectMenu.show();
  }

  hideSelectMenu() {
    this.selectMenu.hide();
  }

  _limitSelection = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Check if range.startContainer is inside the sub-tree of .BRContainer
    const startInBr = !!range.startContainer.parentElement.closest('.BRcontainer');
    const endInBr = !!range.endContainer.parentElement.closest('.BRcontainer');
    if (!startInBr && !endInBr) return;
    if (!startInBr || !endInBr) {
      // weird case, just clear the selection
      selection.removeAllRanges();
      return;
    }

    // Find the last allowed word in the selection
    const lastAllowedWord = genAt(
      genFilter(
        walkBetweenNodes(range.startContainer, range.endContainer),
        (node) => node.classList?.contains(
          this.selectionElement[0].replace(".", ""),
        ),
      ),
      this.options.maxProtectedWords - 1,
    );

    if (!lastAllowedWord || range.endContainer.parentNode == lastAllowedWord) return;

    const newRange = document.createRange();
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.setEnd(lastAllowedWord.firstChild, lastAllowedWord.textContent.length);

    selection.removeAllRanges();
    selection.addRange(newRange);
  };
}

/**
 * @template T
 * Get the i-th element of an iterable
 * @param {Iterable<T>} iterable
 * @param {number} index
 */
export function genAt(iterable, index) {
  let i = 0;
  for (const x of iterable) {
    if (i == index) {
      return x;
    }
    i++;
  }
  return undefined;
}

/**
 * @template T
 * Generator version of filter
 * @param {Iterable<T>} iterable
 * @param {function(T): boolean} fn
 */
export function* genFilter(iterable, fn) {
  for (const x of iterable) {
    if (fn(x)) yield x;
  }
}

/**
 * Depth traverse the DOM tree starting at `start`, and ending at `end`.
 * @param {Node} start
 * @param {Node} end
 * @returns {Generator<Node>}
 */
export function* walkBetweenNodes(start, end) {
  let done = false;

  /**
   * @param {Node} node
   */
  function* walk(node, {children = true, parents = true, siblings = true} = {}) {
    if (node === end) {
      done = true;
      yield node;
      return;
    }

    // yield self
    yield node;

    // First iterate children (depth-first traversal)
    if (children && node.firstChild) {
      yield* walk(node.firstChild, {children: true, parents: false, siblings: true});
      if (done) return;
    }

    // Then iterate siblings
    if (siblings) {
      for (let sib = node.nextSibling; sib; sib = sib.nextSibling) {
        yield* walk(sib, {children: true, parents: false, siblings: false});
        if (done) return;
      }
    }

    // Finally, move up the tree
    if (parents && node.parentNode) {
      yield* walk(node.parentNode, {children: false, parents: true, siblings: true});
      if (done) return;
    }
  }

  yield* walk(start);
}

@customElement('br-menu-option')
export class BRSelectMenuOption extends LitElement {
  @property({type: String})
  icon = '';

  @property({type: String})
  label = '';

  /** @type {string | null} */
  temporaryText = null;

  @property({type: Number, attribute: 'temporary-text-duration'})
  temporaryTextDuration = 1200;

  @property({type: String, attribute: 'aria-label'})
  ariaLabel = '';

  @property({type: Boolean, attribute: 'live-label'})
  liveLabel = false;

  @property({type: Boolean})
  temporaryTextVisible = false;

  /** @type {number | null} */
  temporaryTextTimeoutId = null;

  /** @override */
  createRenderRoot() {
    // Keep styles from existing stylesheet by opting out of shadow DOM
    return this;
  }

  /** @override */
  disconnectedCallback() {
    if (this.temporaryTextTimeoutId != null) {
      window.clearTimeout(this.temporaryTextTimeoutId);
      this.temporaryTextTimeoutId = null;
    }
    super.disconnectedCallback();
  }

  /**
   * @param {string} text
   */
  showTemporaryText(text) {
    if (!text?.trim()) return;

    this.temporaryText = text;

    this.temporaryTextVisible = true;
    if (this.temporaryTextTimeoutId != null) {
      window.clearTimeout(this.temporaryTextTimeoutId);
    }
    this.temporaryTextTimeoutId = window.setTimeout(() => {
      this.temporaryTextVisible = false;
      this.temporaryText = null;
      this.temporaryTextTimeoutId = null;
    }, this.temporaryTextDuration);
  }

  renderIcon() {
    if (this.icon === 'share') {
      return html`<ia-icon-share class="br-select-menu__icon" aria-hidden="true"></ia-icon-share>`;
    }
    if (this.icon === 'edit-pencil') {
      return html`<ia-icon-edit-pencil class="br-select-menu__icon" aria-hidden="true"></ia-icon-edit-pencil>`;
    }
    return '';
  }

  render() {
    const baseLabel = this.label ?? '';
    const hasTemporaryText = !!this.temporaryText;
    const temporaryLabel = hasTemporaryText ? this.temporaryText : baseLabel;
    const showTemporaryLabel = hasTemporaryText && this.temporaryTextVisible;
    const visibleLabel = showTemporaryLabel ? temporaryLabel : baseLabel;
    const providedAriaLabel = this.ariaLabel?.trim();
    const accessibleLabel = providedAriaLabel && providedAriaLabel !== visibleLabel.trim() ? providedAriaLabel : undefined;
    const sizingLabel = baseLabel.length >= temporaryLabel.length ? baseLabel : temporaryLabel;

    return html`
      <button
        type="button"
        class="br-select-menu__option"
        role="menuitem"
        aria-label=${ifDefined(accessibleLabel)}
      >
        ${this.renderIcon()}
        ${hasTemporaryText ? html`
          <span class="br-select-menu__label-wrap" style="display: inline-flex; position: relative; align-items: center;">
            <span
              class="br-select-menu__label"
              style="visibility: hidden;"
              aria-hidden="true"
            >${sizingLabel}</span>
            <span
              class="br-select-menu__label"
              style="position: absolute; inset: 0; display: inline-flex; align-items: center;"
              aria-live=${this.liveLabel ? 'polite' : 'off'}
            >${showTemporaryLabel ? temporaryLabel : baseLabel}</span>
          </span>
        ` : html`
          <span class="br-select-menu__label" aria-live=${this.liveLabel ? 'polite' : 'off'}>${baseLabel}</span>
        `}
      </button>
    `;
  }
}

@customElement('br-select-menu')
class BRSelectMenu extends LitElement {
  /** @type {import('../BookReader.js').default} */
  br;

  /** @type {BRSelectMenuOption | null} */
  @query('#copy-link-option')
  copyLinkOption;

  @property({type: Boolean})
  copyLinkToHighlightEnabled = true;

  @property({type: Boolean})
  highlightAnnotationEnabled = true;

  /**
   * @param {import('../BookReader.js').default} br
   */
  constructor(br) {
    super();
    this.br = br;
  }

  /** @override */
  createRenderRoot() {
    // Disable shadow DOM; that would require a huge rejiggering of CSS
    return this;
  }

  /** @override */
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'menu');
    this.setAttribute('aria-label', 'Text selection actions');
    this.setAttribute('aria-orientation', 'vertical');
  }

  renderCopyLinkToHighlightOption() {
    return html`
      <br-menu-option
        id="copy-link-option"
        @click=${this.handleCopyLinkToHighlight}
        icon="share"
        label="Copy Link to Highlight"
        live-label
      ></br-menu-option>
    `;
  }

  renderRemoveOption() {
    return html`
      <br-menu-option
        @click=${this.handleDeleteHighlight}
        icon="share"
        label="Delete Highlight and Annotation"
      ></br-menu-option>
    `;
  }

  renderAddAnnotationOption() {
    return html`
      <br-menu-option
        @click=${this.handleAddAnnotation}
        icon="edit-pencil"
        label="Annotate"
      ></br-menu-option>
    `;
  }

  renderHighlightOption() {
    return html`
      <br-menu-option
        @click=${this.handleHighlightSave}
        icon="edit-pencil"
        label="Highlight Selection"
      ></br-menu-option>
    `;
  }
  renderLocalStorageOptions() {
    return html`
      <br-menu-option
        @click=${this.renderSavedHighlights}
        icon="share"
        label="Load Highlights"
      ></br-menu-option>
      <br-menu-option
        @click=${() => {window.localStorage.removeItem(BR_HIGHLIGHTS_LOCAL_STORAGE_KEY);}}
        icon="share"
        label="Remove Stored Highlights"
      ></br-menu-option>`;
  }

  render() {
    // TODO change the second button to use a different icon
    return html`
      ${this.copyLinkToHighlightEnabled ? this.renderCopyLinkToHighlightOption() : ''}
      ${this.highlightAnnotationEnabled && !this.nodesForRemoval ? this.renderHighlightOption() : ''}
      ${this.highlightAnnotationEnabled ? this.renderLocalStorageOptions() : ''}
      ${this.nodesForRemoval ? this.renderRemoveOption() : ''}
    `;
  }

  /**
   * @param {MouseEvent} e
   */
  async handleCopyLinkToHighlight(e) {
    e.preventDefault();
    const currentParams = this.br.readQueryString();
    const currentSelection = /** @type {Selection} */ (window.getSelection());
    const range = currentSelection.getRangeAt(0);
    const textLayer = range.startContainer.parentElement.closest('.BRtextLayer');
    const textFragment = BookReaderTextFragment.fromSelection(currentSelection, [textLayer]);

    // Note: Have to do a param construction to avoid url-encoding of commas in the text fragment param
    let linkToHighlightParams = currentParams;
    if (currentParams.includes('text=')) {
      linkToHighlightParams = currentParams.replace(/(text=)[\w\W\d%]+/, `text=${textFragment.toUrlString()}`);
    } else {
      const sep = linkToHighlightParams ? '&' : '?';
      linkToHighlightParams += `${sep}text=${textFragment.toUrlString()}`;
    }
    const currentUrl = window.location;
    const pageNum = textFragment.pageNumber || `n${textFragment.pageIndex}`;
    const adjustedUrlPageNumPath = currentUrl.pathname.replace(/((?:^|[#/])page)\/[^/]+/, `$1/${pageNum}`);
    const hash = currentUrl.hash ? currentUrl.hash.replace(/((?:^|[#/])page)\/[^/]+/, `$1/${pageNum}`) : '';
    const linkToHighlight = `${currentUrl.origin}${adjustedUrlPageNumPath}${linkToHighlightParams}${hash}`;

    await navigator.clipboard.writeText(linkToHighlight);
    this.copyLinkOption?.showTemporaryText('Copied!');
  }

  /**
   * Returns the closest BRtextLayer element on the page that contains the target node
   * @param {Node} node
   * @returns {HTMLElement | null}
   */
  getNodeTextLayer(node) {
    if (!node) return;
    const element = 'closest' in node ? node : node.parentElement;
    return element?.closest('.BRtextLayer') ?? null;
  }

  /**
   * Retrieves the current selected text on the page and serializes the quote contents + context
   * The selection is also changed in the DOM to highlight the words
   */
  handleHighlightSave() {
    const currentSelection = window.getSelection();
    const start = currentSelection.direction === 'backward' ? currentSelection.focusNode.parentElement : currentSelection.anchorNode.parentElement;
    const textLayer = this.getNodeTextLayer(start);
    const highlight = BookReaderTextFragment.fromSelection(currentSelection, [textLayer.parentElement]);
    highlight.uuid = `id-${crypto.randomUUID().split("-")[4]}`;
    const highlights = this.loadHighlightsFromLocalStorage();
    highlights.push(highlight);
    this.saveToLocalStorage(highlights);
    this.renderSavedHighlights();
  }

  handleAddAnnotation(e) {
    // TODO
  }

  handleDeleteHighlight() {
    if (this.nodesForRemoval) {
      const uuid = retrieveUUID(this.nodesForRemoval[0]);
      for (const ele of this.nodesForRemoval) {
        const tempText = ele.textContent;
        const parent = ele.parentElement;
        if (parent.classList.contains('BRwordElement') || parent.classList.contains('BRspace')) {
          ele.remove();
          parent.textContent = tempText;
        } else {
          console.log("This element did not match removal criteria:", parent, ele);
        }
      }
      this.deleteHighlight(uuid);
      this.clearNodesForRemoval();
    } else {
      console.log("there is nothing to remove");
    }
  }

  /**
   * @param {string} uuid
   */
  deleteHighlight(uuid) {
    const highlights = this.loadHighlightsFromLocalStorage();
    for (let idx = 0; idx < highlights.length; idx++) {
      if (highlights[idx].uuid === uuid) {
        highlights.splice(idx, 1);
        this.saveToLocalStorage(highlights);
        return;
      }
    }
  }

  /**
   * Saves all the highlights in an array to localStorage
   * @param {BookReaderSavedHighlight[]} highlights
   */
  saveToLocalStorage(highlights) {
    window.localStorage.setItem(BR_HIGHLIGHTS_LOCAL_STORAGE_KEY, JSON.stringify(highlights.map(hl => hl.toJSON())));
  }

  /**
   * @returns {BookReaderSavedHighlight[]}
   */
  loadHighlightsFromLocalStorage() {
    return JSON.parse(window.localStorage.getItem(BR_HIGHLIGHTS_LOCAL_STORAGE_KEY) || "[]")
      .map(item => BookReaderTextFragment.fromJSON(item));
  }

  renderSavedHighlights() {
    for (const hl of this.loadHighlightsFromLocalStorage()) {
      const textLayer = /** @type {HTMLElement} */ (this.br.$(`.pagediv${hl.pageIndex} .BRtextLayer`)[0]);
      if (!textLayer) continue;
      renderHighlight(textLayer, hl);
      // Attach click behaviour here? Only need one handler per text layer
      $(textLayer)
        .off('mouseup.BRHighlightClick')
        .on('mouseup.BRHighlightClick', (e) => {
          if (!e.target.classList.contains("BRhighlight")) return;
          e.stopPropagation();
          this.handleHighlightClick(e.target);
        });
    }
  }

  /**
   * @param {HTMLElement} target
   */
  handleHighlightClick(target) {
    const textLayer = this.getNodeTextLayer(target);
    const identifier = retrieveUUID(target);
    const selectedQuoteNodes = textLayer.querySelectorAll(`.${identifier}`);

    const firstNode = selectedQuoteNodes[0];
    const lastNode = selectedQuoteNodes[selectedQuoteNodes.length - 1];

    const highlightRange = document.createRange();
    highlightRange.setStart(firstNode, 0);
    highlightRange.setEnd(lastNode, 1);

    const currentSelection = window.getSelection();
    currentSelection.removeAllRanges();
    currentSelection.addRange(highlightRange);
    this.show();
  }

  show() {
    if (this.br.plugins.translate?.userToggleTranslate) return;
    const currentSelection = window.getSelection();
    const start = currentSelection.anchorNode.parentElement;
    const end = currentSelection.focusNode.parentElement; // will always be a text node
    const height = 30;
    const width = 60;
    const startBoundingRect = start.getBoundingClientRect();
    const endBoundingRect = end.getBoundingClientRect();
    let hlButtonTop = startBoundingRect.top - height;
    let hlButtonLeft = startBoundingRect.left - width;
    if (currentSelection.direction == 'backward') {
      hlButtonTop = endBoundingRect.top - height;
      hlButtonLeft = endBoundingRect.left - width;
    }
    this.style.top = `${hlButtonTop}px`;
    this.style.left = `${hlButtonLeft}px`;
    this.style.zIndex = '1';
    this.style.position = 'absolute';
    this.style.display = 'block';
    this.clearNodesForRemoval();
  }

  hide = () => {
    this.style.display = 'none';
    this.clearNodesForRemoval();
    return;
  }

  /**
   * Remove temporary storage for the currently selected highlight and updates selection menu options
   */
  clearNodesForRemoval = () => {
    this.nodesForRemoval = null;
    this.requestUpdate();
  }
}

/**
 * @param {number} numWords
 * @param {string} text
 * @return {string}
 */
export function getFirstWords(numWords, text) {
  text = text.trim();
  const re = new RegExp(String.raw`^(\S+(\s+|$)){1,${numWords}}`);
  const m = text.match(re);
  return m ? m[0].trim() : "";
}

/**
 * @param {number} numWords
 * @param {string} text
 * @return {string}
 */
export function getLastWords(numWords, text) {
  text = text.trim();
  const re = new RegExp(String.raw`((^|\s+)\S+){1,${numWords}}\s*?$`);
  const m = text.match(re);
  return m ? m[0].trim() : "";
}

/**
 * @param {Node} parent
 * @returns {Node}
 */
export function getFirstMostNode(parent) {
  while (parent.firstChild) {
    parent = parent.firstChild;
  }
  return parent;
}

/**
 * @param {Node} parent
 * @returns {Node}
 */
export function getLastMostNode(parent) {
  while (parent.lastChild) {
    parent = parent.lastChild;
  }
  return parent;
}

/**
 * Strips the whitespace to normalize text
 * @param {String} string
 * @returns
 */
function replaceWhitespace(string) {
  return string.replace(/\s+/g, " ");
}

/**
 * Finds all regex matches within a range and returns their ranges.
 * @param {RegExp} regex
 * @param {Range} range - the range to search in
 * @param {Node[]} textNodes - visible text nodes within the range
 * @param {{ normalize?: function(string): string }} [options]
 * @returns {Range[] | undefined} Range for each match, or undefined if no matches are found
 */
export function findRangeForRegExp(regex, range, textNodes, { normalize = (s) => s } = {}) {
  if (!textNodes.length) return undefined;

  const startOffset = textNodes[0] === range.startContainer ?
    range.startOffset :
    0;
  const normalizedWholePageString = normalize(range.toString());
  const normalizedStartOffset = normalize(textNodes[0].textContent.slice(0, startOffset)).length;
  const matchRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);

  const matches = Array.from(normalizedWholePageString.matchAll(matchRegex));
  const resultRanges = matches.map((match) => {
    const start = getBoundaryPointAtIndex(
      normalizedStartOffset + match.index,
      textNodes,
      false,
      { normalize },
    );
    const end = getBoundaryPointAtIndex(
      normalizedStartOffset + match.index + match[0].length,
      textNodes,
      true,
      { normalize },
    );

    if (!start || !end) {
      console.warn("Could not find boundary points for regex match, skipping this match", {match, start, end});
      return undefined;
    }

    const foundRange = new Range();
    foundRange.setStart(start.node, 0);
    foundRange.setEnd(end.node, 1);
    return foundRange;
  });

  const definedRanges = resultRanges.filter((matchRange) => !!matchRange);
  if (!definedRanges?.length) return undefined;
  return definedRanges;
}

/**
 * Uses the index that matches the quote string and normalizes the string contents to find the correct node
 * @param {Number} index
 * @param {Node[]} nodes
 * @param {boolean} isEnd
 * @param {{ normalize?: function(string): string }} [options]
 */
export function getBoundaryPointAtIndex(index, nodes, isEnd, { normalize = (s) => s } = {}) {
  let counted = 0;
  let normalizedData;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.className === 'BRlineElement') {
      // Treat the lineElement as a space for now, will check if the previous node was hyphenated or another lineElement later
      normalizedData = ' ';
    } else {
      if (!normalizedData) normalizedData = normalize(node.textContent);
    }
    let nodeEnd = counted + normalizedData.length;
    if (isEnd) nodeEnd += 1;
    if (nodeEnd > index) {
      const normalizedOffset = index - counted;
      let denormalizedOffset = Math.min(index - counted, node.textContent.length);

      const targetSubstring = isEnd ?
        normalizedData.substring(0, normalizedOffset) :
        normalizedData.substring(normalizedOffset);

      let candidateSubstring = isEnd ?
        normalize(node.textContent.substring(0, normalizedOffset)) :
        normalize(node.textContent.substring(normalizedOffset));

      const direction = (isEnd ? -1 : 1) * (targetSubstring.length > candidateSubstring.length ? -1 : 1);
      while (denormalizedOffset >= 0 &&
               denormalizedOffset <= node.textContent.length) {
        if (candidateSubstring.length === targetSubstring.length) {
          return {node : node, offset: denormalizedOffset};
        }
        denormalizedOffset += direction;

        candidateSubstring = isEnd ?
          node.textContent.substring(0, denormalizedOffset) :
          node.textContent.substring(denormalizedOffset);
      }
    }
    counted += normalizedData.length;

    if (i + 1 < nodes.length) {
      const nextNormalizedData = replaceWhitespace(nodes[i + 1].textContent);
      // Hyphenated words prove to be an issue since spaces are being inserted between BRlineElements
      // 1st case explicitly check the node class to prevent double counted spaces
      // 2nd case can happen from node traversal when loading from localStorage
      if (nodes[i - 1]?.classList.contains("BRwordElement--hyphen") && node.className === 'BRlineElement') {
        counted -= 1;
      } else if (nodes[i - 1]?.className === 'BRlineElement' && node.className === 'BRlineElement') {
        counted -= 1;
      }
      normalizedData = nextNormalizedData;
    }
  }
  return undefined;
}

/**
 * Takes a text quote object and a container element, and wraps the quote
 * within the container element in a span to apply highlight-like styling
 *
 * Iterate through the range and determine the "start" and "end" nodes
 * Example of how this is done via polyfill
 * https://github.com/GoogleChromeLabs/text-fragments-polyfill/blob/main/src/text-fragment-utils.js#L743
 *
 * @param {HTMLElement} textLayer
 * @param {BookReaderTextFragment} textFragment
 * @param {string | null} cssClassName optional css class to add to the highlight span element
 * @return {Element[]} the elements that were created to highlight the text
 */
export function renderHighlight(textLayer, textFragment, cssClassName = null) {
  // Create a range that encompasses the entire text content
  const firstPageNode = getFirstMostNode(textLayer);
  const lastPageNode = getLastMostNode(textLayer);
  const wholePageRange = new Range();
  wholePageRange.setStart(firstPageNode, 0);
  wholePageRange.setEnd(lastPageNode, lastPageNode.textContent.length);
  const normalize = replaceWhitespace;

  // Retrieve the text nodes and relevant whitespace elements
  // Need to keep the BRlineElement nodes in between to keep the index count consistent, remove first BRlineElement since text starts from the first real text node
  const pageWordNodes = Array.from(textLayer.querySelectorAll('.BRwordElement, .BRspace, br, .BRlineElement'));
  pageWordNodes.splice(0, 1);

  const broadRanges = findRangeForRegExp(
    textFragment.toRegExp({ normalize, context: true }),
    wholePageRange,
    pageWordNodes,
    { normalize },
  );
  if (!broadRanges) {
    console.warn("Could not find quote with context in page");
    return;
  }

  const broadRangeWordNodes = [];
  for (const el of walkBetweenNodes(broadRanges[0].startContainer, broadRanges[0].endContainer)) {
    if (el.classList?.contains('BRwordElement') || el.classList?.contains('BRspace') || el.classList?.contains('BRlineElement')) {
      broadRangeWordNodes.push(el);
    }
  }

  // At which point the quote should now be unambiguous!
  const exactRanges = findRangeForRegExp(
    textFragment.toRegExp({ normalize, context: false }),
    broadRanges[0],
    broadRangeWordNodes,
    { normalize },
  );
  if (!exactRanges) {
    throw new Error("Could not find quote in page");
  }
  const startTextNode = getFirstMostNode(exactRanges[0].startContainer);
  const endTextNode = getFirstMostNode(exactRanges[0].endContainer);

  // markRange requires the range to start and end within text nodes
  const exactRangeTextNodes = new Range();
  exactRangeTextNodes.setStart(startTextNode, 0);
  exactRangeTextNodes.setEnd(endTextNode, endTextNode.textContent.length);

  // Don't mark if already marked
  if (startTextNode.parentElement.classList.contains("BRhighlight") ||
      endTextNode.parentElement.classList.contains("BRhighlight")) {
    return;
  }

  return markRange(exactRangeTextNodes, () => {
    const mark = document.createElement("mark");
    mark.classList.add("BRhighlight");
    if (cssClassName) mark.classList.add(cssClassName);
    if (textFragment.uuid) mark.classList.add(textFragment.uuid);
    return mark;
  });
}

/**
 * Given a Range, wraps its text contents in one or more <mark> elements.
 * <mark> elements can't cross block boundaries, so this function walks the
 * tree to find all the relevant text nodes and wraps them.
 * @param {Range} range - the range to mark. Must start and end inside of
 *     text nodes.
 * @param {function(): Element} createWrappingElement - a function that creates
 *    the element to wrap text nodes in. This is called once per text node.
 * @return {Element[]} The <mark> nodes that were created.
 *
 * Lightly adapted from https://github.com/GoogleChromeLabs/text-fragments-polyfill/blob/abc6ed408b3f20e91d9cbda9977748459f5e3877/src/text-fragment-utils.js#L456
 */
function markRange(
  range,
  createWrappingElement = () => document.createElement("mark"),
) {
  if (range.startContainer.nodeType != Node.TEXT_NODE ||
      range.endContainer.nodeType != Node.TEXT_NODE)
    return [];

  // If the range is entirely within a single node, just surround it.
  if (range.startContainer === range.endContainer) {
    const trivialMark = createWrappingElement();
    range.surroundContents(trivialMark);
    return [trivialMark];
  }

  // Start node -- special case
  const startNode = range.startContainer;
  const startNodeSubrange = range.cloneRange();
  startNodeSubrange.setEndAfter(startNode);

  // End node -- special case
  const endNode = range.endContainer;
  const endNodeSubrange = range.cloneRange();
  endNodeSubrange.setStartBefore(endNode);

  // In between nodes
  const marks = [];
  range.setStartAfter(startNode);
  range.setEndBefore(endNode);
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;

        if (node.nodeType === Node.TEXT_NODE)
          return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      },
    },
  );
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const mark = createWrappingElement();
      node.parentNode.insertBefore(mark, node);
      mark.appendChild(node);
      marks.push(mark);
    }
    node = walker.nextNode();
  }

  const startMark = createWrappingElement();
  startNodeSubrange.surroundContents(startMark);
  const endMark = createWrappingElement();
  endNodeSubrange.surroundContents(endMark);

  return [startMark, ...marks, endMark];
}

/**
 * Get UUID assigned to the highlight element from class list
 * @param {HTMLElement} ele
 * @returns
 */
function retrieveUUID(ele) {
  if (!ele) return null;
  const findUUID = Array.from(ele?.classList).filter((name) => {
    if (name.slice(0, 2).includes('id')) {
      return name;
    }
  });
  if (findUUID.length) {
    return findUUID[0];
  }
  return null;
}

/**
 * An extension of the fields defined by the browser-native TextFragment;
 * See https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
 *
 * Text fragment string format: `pageNumber:prefix-,quote,-suffix`
 * Or for long quotes: `pageNumber:prefix-,quoteStart,quoteEnd,-suffix`
 * Note the ':' and ',' separators must not be encoded, but
 * the pageNumber, prefix, quote/quoteStart/quoteEnd, and suffix text can be encoded.
 */
export class BookReaderTextFragment {
  /**
   * @param {object} params
   * @param {string | null}params.prefix
   * @param {string | null} [params.quote]
   * @param {string | null} [params.quoteStart]
   * @param {string | null} [params.quoteEnd]
   * @param {string | null} params.suffix
   * @param {string | null} params.pageNumber Page number; e.g. asserted page number or the n-prefixed page index
   * @param {number} params.pageIndex Page index; e.g. zero-based index of the page
   * @param {string | null} [params.uuid] UUID for the text fragment if it has one
   */
  constructor({ prefix, quote, quoteStart, quoteEnd, suffix, pageNumber, pageIndex, uuid }) {
    /** @type {string|null} */
    this.prefix = prefix;
    /** @type {string | null} */
    this.quote = quote ?? null;
    /** @type {string | null} */
    this.quoteStart = quoteStart ?? null;
    /** @type {string | null} */
    this.quoteEnd = quoteEnd ?? null;
    /** @type {string|null} */
    this.suffix = suffix;
    /** @type {string|null} Page number; e.g. asserted page number or the n-prefixed page index */
    this.pageNumber = pageNumber;
    /** @type {number} Page index; e.g. zero-based index of the page */
    this.pageIndex = pageIndex;
    /** @type {string | null} UUID for the text fragment if it has one */
    this.uuid = uuid ?? null;
  }

  /**
   * Parse a text fragment from its string value (the part after `text=`).
   * Expected format: `pageNumber:prefix-,quote,-suffix`
   * @param {string} str
   * @param {import('@/src/BookReader/BookModel.js').BookModel} book
   * @param {number} fallbackPageIndex A fallback page index to use if the text
   * fragment does not specify a page number or page index.
   * @returns {BookReaderTextFragment}
   */
  static fromString(str, book, fallbackPageIndex) {
    // Basically matches:
    // (stuff):(stuff)-,(stuff),-(stuff)
    const match = str.match(/^(?:(.*?):)?(?:(.*?)-,)?(.*?)(?:,-(.*))?$/);
    if (!match) {
      throw new Error(`Invalid text fragment format: ${str}`);
    }
    const pageNumber = match[1] ? decodeURIComponent(match[1]) : null;
    const prefix = match[2] ? decodeURIComponent(match[2]) : null;
    const quoteRegion = match[3] || '';
    const quoteParts = quoteRegion.split(',');
    let quote = null;
    let quoteStart = null;
    let quoteEnd = null;

    if (quoteParts.length === 1) {
      quote = decodeURIComponent(quoteParts[0]);
    } else if (quoteParts.length === 2) {
      quoteStart = decodeURIComponent(quoteParts[0]);
      quoteEnd = decodeURIComponent(quoteParts[1]);
    } else {
      throw new Error(`Invalid text fragment quote format: ${str}`);
    }

    const suffix = match[4] ? decodeURIComponent(match[4]) : null;
    const pageIndex = pageNumber ? book.getPageIndex(pageNumber) : fallbackPageIndex;
    if (typeof pageIndex !== 'number') {
      throw new Error(`Could not determine page index for text fragment with page number ${pageNumber}`);
    }

    if (!quote && (!quoteStart || !quoteEnd)) {
      throw new Error(`Invalid text fragment quote format: ${str}`);
    }

    return new BookReaderTextFragment({
      prefix,
      quote,
      quoteStart,
      quoteEnd,
      suffix,
      pageNumber,
      pageIndex,
    });
  }

  /**
   * Extract and parse a text fragment from a URL string containing a `text=` parameter.
   * @param {string} urlString
   * @param {import('@/src/BookReader/BookModel.js').BookModel} book
   * @param {number} fallbackPageIndex A fallback page index to use if the text
   * fragment does not specify a page number or page index.
   * @returns {BookReaderTextFragment|null}
   */
  static fromUrl(urlString, book, fallbackPageIndex) {
    // Can't parse with eg new URLSearchParams since the text fragment format includes unencoded
    // commas and colons, so need to do a regex match to extract the text fragment string
    const textMatch = urlString.match(/[&?#]?text=([^&]*)/);
    if (!textMatch) return null;
    return BookReaderTextFragment.fromString(textMatch[1], book, fallbackPageIndex);
  }

  /**
   * Outputs a url-safe string serialization of the text fragment, that's a variation of the standard
   * browser TextFragment format to include page information: `pageNumber:prefix-,quote,-suffix`
  * If quote text is long enough, it is serialized as `quoteStart,quoteEnd`.
    * Note the ':' and ',' separators must not and are not encoded, but
   * the pageNumber, prefix, quote/quoteStart/quoteEnd, and suffix text are encoded.
   * @returns {string}
   */
  toUrlString() {
    // First the page number or index
    let str = this.pageNumber ? `${encodeURIComponent(this.pageNumber)}:` : `n${this.pageIndex}:`;

    if (this.prefix) {
      str += `${encodeURIComponent(this.prefix)}-,`;
    }

    const quote = this.quote?.trim() || null;
    let shortenedQuoteParts = null;
    if (quote && quote.length > MAX_FULL_QUOTE_URL_CHARS) {
      const words = quote.match(/\S+/g) || [];
      if (words.length >= TRUNCATED_QUOTE_WORD_COUNT * 2) {
        const quoteStart = getFirstWords(TRUNCATED_QUOTE_WORD_COUNT, quote);
        const quoteEnd = getLastWords(TRUNCATED_QUOTE_WORD_COUNT, quote);
        if (quoteStart && quoteEnd) {
          shortenedQuoteParts = { quoteStart, quoteEnd };
        }
      }
    }

    if (quote && !shortenedQuoteParts) {
      str += encodeURIComponent(quote);
    } else if (shortenedQuoteParts) {
      str += `${encodeURIComponent(shortenedQuoteParts.quoteStart)},${encodeURIComponent(shortenedQuoteParts.quoteEnd)}`;
    } else if (this.quoteStart && this.quoteEnd) {
      str += `${encodeURIComponent(this.quoteStart)},${encodeURIComponent(this.quoteEnd)}`;
    } else {
      throw new Error('Text fragment requires either a quote or quoteStart/quoteEnd');
    }

    if (this.suffix) {
      str += `,-${encodeURIComponent(this.suffix)}`;
    }
    return str;
  }

  /**
   * Build a regex that matches this quote payload.
   * @param {{ normalize?: function(string): string, context?: boolean }} [options]
   * @returns {RegExp}
   */
  toRegExp({ normalize = (s) => s, context = false } = {}) {
    /** @type {[String] | [String, String]} */
    const quotes = this.quote ? [this.quote] : [this.quoteStart, this.quoteEnd];

    if (context) {
      if (this.prefix) quotes[0] = this.prefix + ' ' + quotes[0];
      if (this.suffix) quotes[quotes.length - 1] = quotes[quotes.length - 1] + ' ' + this.suffix;
    }

    if (quotes.length === 1) {
      return new RegExp(RegExp.escape(normalize(quotes[0])), 'g');
    } else {
      return new RegExp(
        RegExp.escape(normalize(quotes[0])) + '[\\s\\S]*?' + RegExp.escape(normalize(quotes[1])),
        'g',
      );
    }
  }

  toJSON() {
    return {
      prefix: this.prefix,
      quote: this.quote,
      quoteStart: this.quoteStart,
      quoteEnd: this.quoteEnd,
      suffix: this.suffix,
      pageNumber: this.pageNumber,
      pageIndex: this.pageIndex,
      uuid: this.uuid,
    };
  }

  /**
   * Create a BookReaderTextFragment instance from a JSON object.
   * @param {object} json
   * @returns {BookReaderTextFragment}
   */
  static fromJSON(json) {
    return new BookReaderTextFragment(json);
  }

  /**
   * Builds a TextFragment string from a given text selection.
   * @param {Selection} selection currently selected text, eg `document.getSelection()`
   * @param {HTMLElement[]} contextElements elements providing context for the selection
   * @returns {BookReaderTextFragment}
   */
  static fromSelection(selection, contextElements) {
    const range = selection.getRangeAt(0);

    // Partially selected words need to be captured completely
    const fullQuoteRange = new Range();
    const startTextNode = getLastMostNode(range.startContainer);
    const endTextNode = getFirstMostNode(range.endContainer);
    fullQuoteRange.setStart(startTextNode, 0);
    fullQuoteRange.setEnd(endTextNode, range.endOffset == 0 ? 0 : (endTextNode.textContent?.length ?? 0));

    const preStartRange = document.createRange();
    preStartRange.setStart(getFirstMostNode(contextElements[0]), 0);
    preStartRange.setEnd(startTextNode, 0);

    const postEndRange = document.createRange();
    postEndRange.setStart(endTextNode, fullQuoteRange.endOffset);
    const lastWordOfPageEl = getLastMostNode(contextElements[contextElements.length - 1]);
    postEndRange.setEnd(lastWordOfPageEl, Math.max(0, lastWordOfPageEl.textContent.length - 1));

    // prefixes/suffixes cannot contain paragraph breaks, words that are from more than one line break away should not be included
    const prefix = getLastWords(3, preStartRange.toString())
      .replace(/[ ]+/g, " ")
      .trim()
      .replace(/^[^\n]*\n/gm, "");
    const suffix = getFirstWords(3, postEndRange.toString())
      .replace(/[ ]+/g, " ")
      .trim()
      .replace(/\n[^\n]*$/gm, "");


    // Guarantee that all whitespace is replaced with just one space and that the first/last word of the highlight is not a space
    const quote = fullQuoteRange.toString().replace(/\s+/g, " ").trim();
    const pageContainerEl = startTextNode.parentElement.closest(".BRpagecontainer");

    return new BookReaderTextFragment({
      quote,
      prefix,
      suffix,
      pageNumber: pageContainerEl.getAttribute("data-page-num"),
      pageIndex: parseFloat(pageContainerEl.getAttribute("data-index")),
    });
  }
}

/**
 * @typedef {BookReaderTextFragment & { uuid: string }} BookReaderSavedHighlight
 */
