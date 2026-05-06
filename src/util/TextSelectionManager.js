// @ts-check
import { SelectionObserver } from "../BookReader/utils/SelectionObserver.js";
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@internetarchive/icon-share';

export class TextSelectionManager {
  options = {
    // Current Translation plugin implementation does not have words, will limit to one BRlineElement for now
    maxProtectedWords: 200,
  }

  /** @type {BRSelectMenu} */
  selectMenu;
  /** @type {boolean} */
  selectionMenuEnabled = false;
  highlightAnnotationEnabled = false;
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

    this.selectMenu = new BRSelectMenu(br, selectionElement, this.selectionMenuEnabled, this.highlightAnnotationEnabled);
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
        this.selectMenu.showMenu();

      }

      if (selectEvent == 'focusChanged') {
        console.log("detected focusChanged event", {mouseIsDown: this.mouseIsDown, selection: window.getSelection().toString()});
        // hide the button as user changes their selection
        if (this.mouseIsDown) {
          this.selectMenu.hideMenu();
        } else if (window.getSelection().toString()) {
          this.selectMenu.showMenu();
          const selectedElement = window.getSelection()?.anchorNode;
          if (selectedElement.classList.contains('BRhighlight')) {
            this.getHighlightedNodes(selectedElement);
          }
        }
      }

      if (selectEvent == 'cleared') {
        console.log("detected cleared event");
        this.selectMenu.hideMenu();
      }
    }).attach();
  }

  // Need attach + detach methods to toggle w/ Translation plugin
  attach() {
    this.selectionObserver.attach();
    if (this.selectionMenuEnabled) {
      this.renderSelectionMenu();
    }
    if (this.highlightAnnotationEnabled) {
      this.renderHighlightMenu();
    }

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

  renderSelectionMenu() {
    this.selectMenu.copyHighlightEnabled = true;
    if (this.highlightAnnotationEnabled) {
      this.selectMenu.requestUpdate();
    } else {
      document.body.append(this.selectMenu);
    }
  }

  renderHighlightMenu() {
    this.selectMenu.highlightAnnotationEnabled = true;
    if (this.selectionMenuEnabled) {
      this.selectMenu.requestUpdate();
    } else {
      document.body.append(this.selectMenu);
    }
  }
  /**
   * @param {'started' | 'cleared' | 'focusChanged'} type
   * @param {HTMLElement} target
   */
  _onSelectionChange = (type, target) => {
    if (type === 'started') {
      this.textSelectingMode(target);
    } else if (type === 'cleared') {
      this.defaultMode(target);
    } else if (type === 'focusChanged') {
      // do nothing, just wait for the mouseup to trigger the styling change
    } else if (type === 'highlightSelected') {
      this.getHighlightedNodes(target);
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
      this.selectMenu.hideMenu();
      if ($(event.target).is(this.selectionElement.join(", "))) {
        event.stopPropagation();
      }
    });

    $(textLayer).on("mouseup.textSelectPluginHandler", (event) => {
      this.mouseIsDown = false;
      this.selectMenu.hideMenu();
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
      this.selectMenu.hideMenu();
    });

    // Prevent page flip on click
    $(textLayer).on('mouseup.textSelectPluginHandler', (event) => {
      this.mouseIsDown = false;
      if (event.which != 1) return;
      event.stopPropagation();
      this.selectMenu.showMenu();
    });
  }

  getHighlightedNodes(element) {
    const highlightIdentifier = retrieveUUID(element);
    const highlightNodes = document.querySelectorAll(`.${highlightIdentifier}`);
    this.selectMenu.nodesForRemoval = highlightNodes;
    this.selectMenu.requestUpdate();
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
 * Builds a TextFragment string from a given text selection.
 * Note does not include the fragment directive `:~:` or # symbol
 * See https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
 * @param {Selection} selection currently selected text, eg `document.getSelection()`
 * @param {HTMLElement[]} contextElements elements providing context for the selection
 * @returns {string}
 */
export function createTextFragmentUrlParam(selection, contextElements) {
  const direction = selection.direction;
  const startNode = direction == 'backward' ? selection.focusNode : selection.anchorNode;
  const endNode = direction == 'backward' ? selection.anchorNode : selection.focusNode;

  const preStartRange = document.createRange();
  preStartRange.setStart(contextElements[0].firstElementChild, 0);
  preStartRange.setEnd(startNode, 0);

  const postEndRange = document.createRange();
  postEndRange.setStart(endNode, endNode.textContent.length);
  const lastWordOfPageEl = getLastMostElement(contextElements[contextElements.length - 1]);
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

  // Partially selected words need to be captured completely
  // Guarantee that all whitespace is replaced with just one space and that the first/last word of the highlight is not a space
  const fullHighlight = selection.toString().replace(/\s+/g, " ").trim().split(/\s/g);
  // Capture start/end words that may be partially highlighted
  if (startNode.textContent.trim().length != 0) {
    if (!startNode.textContent.includes(fullHighlight[0])) {
      fullHighlight.unshift(startNode.textContent);
    } else {
      fullHighlight[0] = startNode.textContent;
    }
  }
  if (endNode.textContent.trim().length != 0) {
    if (!endNode.textContent.includes(fullHighlight[fullHighlight.length - 1])) {
      fullHighlight.push(endNode.textContent);
    }
    fullHighlight[fullHighlight.length - 1] = endNode.textContent;
  }

  const quote = [fullHighlight.join(" ")];

  const textFragmentArr = [];
  let prefixString = '';
  let suffixString = '';
  const pageString = `&dIndex=${startNode.parentElement.closest(".BRpagecontainer").getAttribute('data-index')}`;

  if (prefix) prefixString = `prefix=${encodeURIComponent(prefix)}&`;
  textFragmentArr.push(...quote);
  if (suffix) suffixString = `&suffix=${encodeURIComponent(suffix)}`;
  return `${prefixString}text=${encodeURIComponent(quote)}${suffixString}${pageString}`;
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

@customElement('br-select-menu')
class BRSelectMenu extends LitElement {
  /** @type {import('../BookReader.js').default} */
  br;
  selectionElement;
  copyHighlightEnabled;
  highlightAnnotationEnabled;

  constructor(br, selectionElement, copyHighlightEnabled, highlightAnnotationEnabled) {
    super();
    this.br = br;
    this.selectionElement = selectionElement;
    this.copyHighlightEnabled = copyHighlightEnabled;
    this.highlightAnnotationEnabled = highlightAnnotationEnabled;
  }

  /** @override */
  createRenderRoot() {
    // Disable shadow DOM; that would require a huge rejiggering of CSS
    return this;
  }

  addShareHighlightHTML() {
    return html`
      <button @click=${this.handleCopyLinktoHighlight} 
        class="br-select-menu__option">
        <ia-icon-share class="br-select-menu__icon aria-hidden="true"></ia-icon-share>
        <span class="br-select-menu__label">Copy Link to Highlight</span>
      </button>
    `;
  }

  addRemovalOption() {
    return html`
      <button @click=${this.handleDeleteHighlight}
        class="br-select-menu__option">
        <ia-icon-share class="br-select-menu__icon" aria-hidden="true"></ia-icon-share>
        <span class="br-select-menu__label">Delete Highlight and Annotation</span>
      </button>
    `;
  }

  addAnnotationOption() {
    return html`
      <button @click=${this.handleAnnotation}
        class="br-select-menu__option">
        <ia-icon-edit-pencil class="br-select-menu__icon" aria-hidden="true"></ia-icon-edit-pencil>
        <span class="br-select-menu__label">Annotate</span>
      </button>
    `;
  }

  addHighlightOption() {
    return html`
      <button @click=${this.handleHighlightSave} 
        .selectionElement=${this.selectionElement}
        class="br-select-menu__option">
        <ia-icon-edit-pencil class="br-select-menu__icon" aria-hidden="true"></ia-icon-edit-pencil>
        <span class="br-select-menu__label">Highlight Selection</span>
      </button>
    `;
  }
  addLocalStorageOption() {
    return html`
      <button @click=${this.retrieveHighlightFromLocalStorage} 
        class="br-select-menu__option">
        <ia-icon-share class="br-select-menu__icon" aria-hidden="true"></ia-icon-share>
        <span class="br-select-menu__label">Load Highlights</span>
      </button>
      <button @click=${() => {window.localStorage.removeItem("highlightStorage");}}
        class="br-select-menu__option">
        <ia-icon-share class="br-select-menu__icon" aria-hidden="true"></ia-icon-share>
        <span class="br-select-menu__label">Remove Stored Highlights</span>
      </button>`;
  }

  // TODO change the second button to use a different icon
  render() {
    return html`
      ${this.highlightAnnotationEnabled && !this.nodesForRemoval ? this.addHighlightOption() : ''}
      ${this.highlightAnnotationEnabled ? this.addLocalStorageOption() : ''}
      ${this.copyHighlightEnabled ? this.addShareHighlightHTML() : ''}
      ${this.nodesForRemoval ? this.addRemovalOption() : ''}
    `;
  }

  /**
   * @param {MouseEvent} e
  */
  handleCopyLinktoHighlight(e) {
    e.preventDefault();
    const currentParams = this.br.readQueryString();
    const currentSelection = window.getSelection();
    const textLayer = currentSelection.anchorNode.parentElement.closest('.BRtextLayer');
    const textFragmentUrlParam = createTextFragmentUrlParam(currentSelection, Array.from(document.querySelectorAll('.BRpage-visible')));

    // Note: Have to do a param construction to avoid url-encoding of commas in the text fragment param
    let linkToHighlightParams = currentParams;
    if (currentParams.includes('text=')) {
      linkToHighlightParams = currentParams.replace(/(text=)[\w\W\d%]+/, textFragmentUrlParam);
    } else {
      const sep = linkToHighlightParams ? '&' : '?';
      linkToHighlightParams += `${sep}${textFragmentUrlParam}`;
    }
    const currentUrl = window.location;
    // TODO - updateResumeValue + getCookiePath in plugin.resume.js overrides the adjustedUrlPageNumPath, check how to workaround this
    // TODO - won't work with hash mode
    const adjustedUrlPageNumPath = currentUrl.pathname.toString().replace(/(?<=\/page\/)\d+(?=\/)/, textLayer.parentElement.getAttribute('data-page-num'));
    const linkToHighlight = `${currentUrl.origin}${adjustedUrlPageNumPath}${linkToHighlightParams}${currentUrl?.hash || ''}`;

    navigator.clipboard.writeText(linkToHighlight);
  }

  /**
   * Returns the closest BRtextLayer element on the page that contains the target node
   * @param {Node} node
   * @returns {Node | null}
   */
  getNodeTextLayer(node) {
    if (!node) return;
    const element = 'closest' in node ? node : node.parentElement;
    return element?.closest('.BRtextLayer') ?? null;
  }

  /**
   * Prepare a DOM range for generating selectors and finding the containing text layer
   * @param {Node} start
   * @param {Node} end
   * @returns
   */
  getTextLayerForRange(start, end) {
    const range = new Range();
    try {
      range.setStart(start, 0);
      range.setEnd(end, 1);
    } catch {
      throw new Error ('Selection does not contain text');
    }
    const startTextLayer = this.getNodeTextLayer(range.startContainer);
    const endTextLayer = this.getNodeTextLayer(range.endContainer);
    if (!startTextLayer || !endTextLayer) {
      throw new Error ('Selection goes beyond the book reader page layers');
    }
    if (startTextLayer !== endTextLayer) {
      throw new Error('Selecting across page breaks is not supported');
    }
    return [range, startTextLayer];
  }

  /**
   * Retrieves the current selected text on the page and serializes the quote contents + context
   * The selection is also changed in the DOM to highlight the words
   */
  handleHighlightSave(e) {
    const currentSelection = window.getSelection();
    const start = currentSelection.direction === 'backward' ? currentSelection.focusNode.parentElement : currentSelection.anchorNode.parentElement;
    const end = currentSelection.direction === 'backward' ? currentSelection.anchorNode.parentElement : currentSelection.focusNode.parentElement;

    const output = this.createQuoteStorage(currentSelection, [this.getNodeTextLayer(start).parentElement]);
    this.saveToLocalStorage(output);
    changeDOMtoHighlight(start, end, this.selectionElement, output.uuid);
    // this.nodesForRemoval =
  }

  handleAnnotation(e) {
    // TODO
  }

  handleDeleteHighlight(e) {
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
      this.changeToLocalStorage(uuid);
      this.clearNodesForRemoval();
    } else {
      console.log("there is nothing to remove");
    }
  }

  /**
   * Saves the highlighted text and context in an array to localStorage
   * If a 'highlightStorage' object already exists, the content will be appended to the array
   * @param {any} contents
   */
  saveToLocalStorage(contents) {
    try {
      const existingHighlightStorage = window.localStorage.getItem("highlightStorage");
      if (existingHighlightStorage) {
        const item = JSON.parse(existingHighlightStorage);
        item.push(contents);
        window.localStorage.setItem("highlightStorage", JSON.stringify(item));
      } else {
        window.localStorage.setItem("highlightStorage", JSON.stringify([contents]));
      }
    } catch (e) {
      console.error(e);
    }
  }

  changeToLocalStorage(storageId) {
    try {
      const existingHighlightStorage = window.localStorage.getItem("highlightStorage");
      if (existingHighlightStorage) {
        const storageObject = JSON.parse(existingHighlightStorage);
        for (const idx in storageObject) {
          if (storageObject[idx].uuid === storageId) {
            storageObject.splice(idx, 1);
            window.localStorage.setItem("highlightStorage", JSON.stringify(storageObject));
            return;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * @param {string} keyName
   * @returns {any | null | undefined}
   */
  loadFromLocalStorage(keyName) {
    let test;
    if (window.localStorage.key(0)) {
      try {
        test = JSON.parse(window.localStorage.getItem(keyName));
        return test;
      } catch (e) {
        console.error(e);
        throw new Error("Could not load from localStorage");
      }
    }
  }

  retrieveHighlightFromLocalStorage() {
    const stored = this.loadFromLocalStorage("highlightStorage");
    if (!stored) return;
    for (const item of stored) {
      convertRangeToDOMSelection(item);
    }
  }

  /**
 *
 * @param {Selection} selection currently selected text, eg `document.getSelection()`
 * @param {HTMLElement[]} contextElements elements providing context for the selection
 * @returns {any}
 */
  createQuoteStorage(selection, contextElements) {
  // https://web.dev/articles/text-fragments#:~:text=In%20its%20simplest%20form%2C%20the%20syntax%20of,percent%2Dencoded%20text%20I%20want%20to%20link%20to.
    const direction = selection.direction;
    const startNode = direction == 'backward' ? selection.focusNode : selection.anchorNode;
    const endNode = direction == 'backward' ? selection.anchorNode : selection.focusNode;

    const preStartRange = document.createRange();
    preStartRange.setStart(contextElements[0].firstElementChild, 0);
    preStartRange.setEnd(startNode, 0);

    const postEndRange = document.createRange();
    postEndRange.setStart(endNode, endNode.textContent.length);
    const lastWordOfPageEl = getLastMostElement(contextElements[contextElements.length - 1]);
    postEndRange.setEnd(lastWordOfPageEl, 0);

    const prefix = getLastWords(3, preStartRange.toString())
      .replace(/[ ]+/g, " ")
      .trim()
      .replace(/^[^\n]*\n/gm, "");
    const suffix = getFirstWords(3, postEndRange.toString())
      .replace(/[ ]+/g, " ")
      .trim()
      .replace(/\n[^\n]*$/gm, "");

    const fullHighlight = selection.toString().replace(/\s+/g, " ").trim().split(/\s/g);

    if (startNode.textContent.trim().length != 0) {
      if (!startNode.textContent.includes(fullHighlight[0])) {
        fullHighlight.unshift(startNode.textContent);
      } else {
        fullHighlight[0] = startNode.textContent;
      }
    }
    if (endNode.textContent.trim().length != 0) {
      if (!endNode.textContent.includes(fullHighlight[fullHighlight.length - 1])) {
        fullHighlight.push(endNode.textContent);
      } else {
        fullHighlight[fullHighlight.length - 1] = endNode.textContent;
      }
    }

    const quote = fullHighlight.join("  ");

    const textFragmentArr = [];
    if (prefix) textFragmentArr.push(`${prefix}-`);
    textFragmentArr.push(...quote);
    if (suffix) textFragmentArr.push(`-${suffix}`);
    const uuid = `id-${crypto.randomUUID().split("-")[4]}`;
    return {
      prefix,
      suffix,
      quote,
      dPageNum: contextElements[0].getAttribute("data-page-num"),
      dIndex: contextElements[0].getAttribute("data-index"),
      uuid,
    };
  }

  showAnnotation(lineElement) {
    const newSelection = document.createElement("div");
    newSelection.className = "annotationMenu";
    newSelection.style.position = "absolute";
    newSelection.style.backgroundColor = "orange";

    const inputBox = document.createElement("input");
    inputBox.className = "inputBox";
    inputBox.style.position = "relative";
    newSelection.appendChild(inputBox);
    lineElement.appendChild(newSelection);
  }

  showMenu() {
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

  hideMenu = () => {
    this.style.display = 'none';
    this.clearNodesForRemoval();
    return;
  }

  /** Remove temporary storage for the currently selected highlight and updates selection menu options
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
 * @param {HTMLElement | Element} parent
 * @returns {Node}
 */
export function getLastMostElement(parent) {
  while (parent.lastElementChild) {
    parent = parent.lastElementChild;
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
   * Checks if quote matches the text content and existing range, then identifies the start and end nodes that contain the quote string.
   * @param {String} quote - The text to find
   * @param {Range} range - the range to search in
   * @param {Node[]} textNodes - visible text nodes within the range
   * @returns
   */
export function deriveRangeFromNodes(quote, range, textNodes) {
  const startOffset = textNodes[0] === range.startContainer ?
    range.startOffset :
    0;
  const normalizedWholePageString = replaceWhitespace(range.toString());
  const normalizedQuote = replaceWhitespace(quote);
  let searchStart = 0;
  let start;
  let end;
  while (searchStart < normalizedWholePageString.length) {
    const matchedIndex = normalizedWholePageString.indexOf(normalizedQuote, searchStart);
    if (matchedIndex === -1) return undefined;
    const normalizedStartOffset = replaceWhitespace(textNodes[0].textContent.slice(0, startOffset)).length;
    start = getBoundaryPointAtIndex(
      normalizedStartOffset + matchedIndex,
      textNodes, false);
    end = getBoundaryPointAtIndex(
      normalizedStartOffset + matchedIndex + normalizedQuote.length,
      textNodes, true);
    if (start != null && end != null) {
      const foundRange = new Range();
      foundRange.setStart(start.node, 0);
      foundRange.setEnd(end.node, 1);
      return foundRange;
    }
    searchStart = matchedIndex + 1;
  }
  return undefined;
}


/**
   * Uses the index that matches the quote string and normalizes the string contents to find the correct node
   * @param {Number} index
   * @param {Node[]} nodes
   * @param {boolean} isEnd
   */
export function getBoundaryPointAtIndex(index, nodes, isEnd) {
  let counted = 0;
  let normalizedData;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.className === 'BRlineElement') {
      // Treat the lineElement as a space for now, will check if the previous node was hyphenated or another lineElement later
      normalizedData = ' ';
    } else {
      if (!normalizedData) normalizedData = replaceWhitespace(node.textContent);
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
        replaceWhitespace(node.textContent.substring(0, normalizedOffset)) :
        replaceWhitespace(node.textContent.substring(normalizedOffset));

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
      /** Hyphenated words prove to be an issue since spaces are being inserted between BRlineElements
         * 1st case explicitly check the node class to prevent double counted spaces
         * 2nd case can happen from node traversal when loading from localStorage
         */
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
 * Takes a highlightObject from localStorage which includes data-index and data-page-num
 * to create a range if the page is visible within the DOM
 *
 * Iterate through the range and determine the "start" and "end" nodes
 * Example of how this is done via polyfill
 * https://github.com/GoogleChromeLabs/text-fragments-polyfill/blob/main/src/text-fragment-utils.js#L743
 * @param {import('../plugins/url/UrlPlugin.js').BookReaderSavedHighlight} quote
 */
export function convertRangeToDOMSelection(quote) {
  // 1. Extract the page data and check if the page is currently visible
  const pageClass = `pagediv${quote.dIndex}`;
  const storedPageElement = document.querySelector(`.${pageClass}`);
  if (!storedPageElement) return;
  // 2. Retrieve the text nodes and relevant whitespace elements
  const allWordNodes = Array.from(storedPageElement.querySelectorAll('.BRwordElement, .BRspace, br, .BRlineElement'));

  // Need to keep the BRlineElement nodes in between to keep the index count consistent, remove first BRlineElement since text starts from the first real text node
  allWordNodes.splice(0, 1);
  const lastWordNodeIndex = allWordNodes.length - 1;

  // 3. Create a range that encompasses the entire text content
  const wholePageAsRange = new Range();
  wholePageAsRange.setStart(allWordNodes[0], 0);
  wholePageAsRange.setEnd(allWordNodes[lastWordNodeIndex], 0);

  // 4. Convert the whole page range into a normalized string, get the index of where the stored string matches the quote
  const convertedString = replaceWhitespace(wholePageAsRange.toString());
  const convertedQuote = replaceWhitespace(quote.quote);
  const foundStringIndex = convertedString.indexOf(convertedQuote);
  if (foundStringIndex == -1) return;
  const fullContext = [quote.prefix, quote.quote, quote.suffix].join(" ");
  const convertedFullContext = replaceWhitespace(fullContext);

  const relevantRange = deriveRangeFromNodes(convertedFullContext, wholePageAsRange, Array.from(allWordNodes));

  const adjustedNodes = [];
  for (const el of walkBetweenNodes(relevantRange?.startContainer, relevantRange?.endContainer)) {
    if (el?.classList?.contains('BRwordElement') || el?.classList?.contains('BRspace') || el?.classList?.contains('BRlineElement')) {
      adjustedNodes.push(el);
    }
  }

  // Range Object returned
  const output = deriveRangeFromNodes(quote.quote, relevantRange, adjustedNodes);

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(output);
  // Assumes the selection start/ends are the correct BRwordElement / BRspace elements
  const start = selection.anchorNode;
  const end = selection.focusNode;
  changeDOMtoHighlight(start, end, [".BRwordElement", '.BRspace'], quote.uuid);

  selection?.removeAllRanges();
}

function createAnnotationBox(nodes) {
  const identifier = retrieveUUID(nodes);
  const quoteNodes = document.querySelectorAll(`.${identifier}`);

  const firstNode = quoteNodes[0];
  const lastNode = quoteNodes[quoteNodes.length - 1];

  const highlightRange = document.createRange();
  highlightRange.setStart(firstNode, 0);
  highlightRange.setEnd(lastNode, 1);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(highlightRange);
}

/**
 *
 * @param {Node} start BRwordElement or BRspace
 * @param {Node} end BRwordElement or BRspace
 * @param {Array[string]} selectionElement
 * @param {string} uuid
 */
export function changeDOMtoHighlight(start, end, selectionElement, uuid) {
  const nodes = [];
  if (start === end) nodes.push(start);

  for (const el of walkBetweenNodes(start, end)) {
    const validElement =
      el?.classList?.contains(selectionElement[0].replace(".", "")) ||
      el?.classList?.contains(selectionElement[1].replace(".", ""));
    if (validElement) nodes.push(el);
  }

  const textLayer = start.parentElement.closest('.BRtextLayer');
  textLayer?.addEventListener('mouseup', (e) => {
    if (!e.target.classList.contains("BRhighlight")) return;
    e.stopPropagation();
    createAnnotationBox(e.target);
    window.br.plugins.textSelection.textSelectionManager.selectMenu.showMenu();
  });

  for (const element of nodes) {
    const highlightSpan = document.createElement("span");
    highlightSpan.className = "BRhighlight";
    highlightSpan.classList.add(uuid);
    highlightSpan.textContent = element.textContent;
    element.textContent = null;
    element.appendChild(highlightSpan);
  }
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

