// @ts-check
import { SelectionObserver } from "../BookReader/utils/SelectionObserver.js";
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@internetarchive/icon-share';

export class TextSelectionManager {
  /** @type {BRSelectMenu} */
  selectMenu;
  selectionMenuEnabled;
  options = {
    // Current Translation plugin implementation does not have words, will limit to one BRlineElement for now
    maxProtectedWords: 200,
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
        this.selectMenu.showMenu();

      }

      if (selectEvent == 'focusChanged') {
        // hide the button as user changes their selection
        if (this.mouseIsDown) {
          this.selectMenu.hideMenu();
        } else if (window.getSelection().toString()) {
          this.selectMenu.showMenu();
        }
      }

      if (selectEvent == 'cleared') {
        this.selectMenu.hideMenu();
      }
    }).attach();
  }

  // Need attach + detach methods to toggle w/ Translation plugin
  attach() {
    this.selectionObserver.attach();
    this.renderSelectionMenu();
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
    if (document.querySelector('.br-select-menu__option')) return;
    if (this.selectionMenuEnabled) {
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

/** TODO ->
 * Can import something that handles this more gracefully? see - https://web.dev/articles/text-fragments#:~:text=In%20its%20simplest%20form%2C%20the%20syntax%20of,percent%2Dencoded%20text%20I%20want%20to%20link%20to.
 */
/**
 * Builds a URL string in the format of a TextFragment within the URL params, which differs from browser "Copy to link to highlighted text" format
 * Does not include the fragment directive (`:~:`) and is not after the URL hash
 * See https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
 * @param {Selection} selection - document.getSelection()
 * @param {HTMLElement} pageLayer - anchorNode.parentElement.closest('.BRtextLayer')
 * @returns {string} - i.e. http://127.0.0.1:8000/BookReaderDemo/demo-internetarchive.html?ocaid=adventureofsherl0000unse&text=undefined,undefined#page/10/mode/2up
 */
export function createTextFragmentUrlParam(selection, pageLayer) {
  // :~:text=[prefix-,]textStart[,textEnd][,-suffix]
  const highlightedText = selection.toString().replace(/[\s]+/g, " ").trim().split(" ");
  const direction = selection.direction;
  const startNode = direction == 'backward' ? selection.focusNode : selection.anchorNode;
  const endNode = direction == 'backward' ? selection.anchorNode : selection.focusNode;
  // If text selection begins or ends with a space, we look for the next eligible word to serve as the start or end word
  const startWord = startNode.textContent.replace(/[\s]+/g, "") ? startNode.textContent : highlightedText[0];
  const endWord = endNode.textContent.replace(/[\s]+/g, "") ? endNode.textContent : highlightedText[highlightedText.length - 1];

  const textStartRe = RegExp.escape(startWord);
  const textEndRe = RegExp.escape(endWord);

  // 's' regex modifier ensures the `.` also captures newline characters
  // Need to use lookahead/lookbehind assertions to allow for overlapping quotes (i.e. multiple "Holmes" on the same page)
  const startPhraseMatchRe = new RegExp(String.raw`(?<=(${textStartRe}).*?)(${textEndRe})`, "gis");
  const endPhraseMatchRe = new RegExp(String.raw`(${textStartRe})(?=.*?(${textEndRe}))`, "gis");

  // Duplicated spaces in pageLayer.textContent for some reason
  const wholePageText = Array.from(document.querySelectorAll('.BRpage-visible'))
    .map((item) => item.textContent)
    .join(' ')
    .replace(/\s+/g, " ") || pageLayer.textContent.replace(/\s+/g, " ");
  const startPhraseFoundMatches = wholePageText.matchAll(startPhraseMatchRe).toArray();
  const endPhraseFoundMatches = wholePageText.matchAll(endPhraseMatchRe).toArray();
  if (startPhraseFoundMatches.length == 1 && endPhraseFoundMatches.length == 1) {
    // If `startWord...endWord` quote is unambiguous and only occurs once, no prefix-/-suffix is needed for the URL param
    return `text=${encodeURIComponent(startWord)},${encodeURIComponent(endWord)}`;
  }

  // Need to add some additional context to `startWord...endWord` by including surrounding words before and after the keywords
  const preStartRange = document.createRange();

  const previousPageContainer = pageLayer.parentElement?.previousElementSibling;
  if (previousPageContainer?.classList.contains("BRpage-visible")) {
    preStartRange.setStart(previousPageContainer, 0);
  } else {
    preStartRange.setStart(pageLayer.firstElementChild, 0);
  }
  preStartRange.setEnd(startNode, 0);
  const postEndRange = document.createRange();
  postEndRange.setStart(endNode, endNode.textContent.length);
  const nextPageContainer = pageLayer.parentElement.nextElementSibling;
  if (nextPageContainer?.classList.contains("BRpage-visible")) {
    const nextPageLastWord = getLastestElement(nextPageContainer);
    postEndRange.setEnd(nextPageLastWord, Math.max(0, nextPageLastWord.textContent.length - 1));
  } else {
    const lastWordOfPageEl = getLastestElement(pageLayer);
    postEndRange.setEnd(lastWordOfPageEl, Math.max(0, lastWordOfPageEl.textContent.length - 1));
  }
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

  let quote = [fullHighlight.join(" ")];
  if (fullHighlight.length > 6) {
    quote = [fullHighlight.slice(0, 3).join(" "), fullHighlight.slice(-3).join(" ")];
  }

  const textFragmentArr = [];
  if (prefix) textFragmentArr.push(`${prefix}-`);
  textFragmentArr.push(...quote);
  if (suffix) textFragmentArr.push(`-${suffix}`);

  return `text=${textFragmentArr.map(encodeURIComponent).join(',')}`;
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

  constructor(br) {
    super();
    this.br = br;
  }

  /** @override */
  createRenderRoot() {
    // Disable shadow DOM; that would require a huge rejiggering of CSS
    return this;
  }

  render() {
    return html`
      <button @click=${this.handleCopyLinkToHighlight} class="br-select-menu__option">
        <ia-icon-share class="br-select-menu__icon" aria-hidden="true"></ia-icon-share>
        <span class="br-select-menu__label">Copy Link to Highlight</span>
      </button>
    `;
  }

  handleCopyLinkToHighlight(e) {
    e.preventDefault();
    const currentUrl = window.location;
    let currentParams = this.br.readQueryString();
    const currentSelection = window.getSelection();
    /** @type {HTMLElement} */
    const textLayer = currentSelection.anchorNode.parentElement.closest('.BRtextLayer');
    // To do - updateResumeValue + getCookiePath in plugin.resume.js overrides the adjustedUrlPageNumPath, check how to workaround this
    const adjustedUrlPageNumPath = currentUrl.pathname.toString().replace(/(?<=\/page\/)\d+(?=\/)/, textLayer.parentElement.getAttribute('data-page-num'));
    if (currentParams.includes('text=')) {
      currentParams = currentParams.replace(/(text=)[\w\W\d%]+/, createTextFragmentUrlParam(currentSelection, textLayer));
    } else {
      if (this.br.options.urlMode === 'history') {
        currentParams = `?${createTextFragmentUrlParam(currentSelection, textLayer)}`;
      } else {
        currentParams = `${currentParams}&${createTextFragmentUrlParam(currentSelection, textLayer)}`;
      }
    }
    if (this.br.options.urlMode === 'history') {
      navigator.clipboard.writeText(`${currentUrl.origin}${adjustedUrlPageNumPath}${currentParams}`);
    } else {
      navigator.clipboard.writeText(`${currentUrl.origin}${adjustedUrlPageNumPath}${currentParams}${currentUrl?.hash}`);
    }
  }

  showMenu() {
    if (this.br.plugins.translate) return;
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
    this.style.display = 'inline';
  }

  hideMenu = () => {
    this.style.display = 'none';
    return;
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
export function getLastestElement(parent) {
  while (parent.lastElementChild) {
    parent = parent.lastElementChild;
  }
  return parent;
}
