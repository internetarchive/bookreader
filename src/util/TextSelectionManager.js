// @ts-check
import { SelectionObserver } from "../BookReader/utils/SelectionObserver.js";
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@internetarchive/icon-share';

export class TextSelectionManager {
  /** @type {BRSelectionMenu} */
  highlightBar;
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
    this.highlightBar = new BRSelectionMenu(br);

    this.highlightBar.className = "br-selection-menu__root";
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
        this.highlightBar.showMenu();

      }

      if (selectEvent == 'focusChanged') {
        // hide the button as user changes their selection
        if (this.mouseIsDown) {
          this.highlightBar.hideMenu();
        } else if (window.getSelection().toString()) {
          this.highlightBar.showMenu();
        }
      }

      if (selectEvent == 'cleared') {
        this.highlightBar.hideMenu();
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
    if (document.querySelector('.textFragmentBar')) return;
    if (this.selectionMenuEnabled) {
      document.body.append(this.highlightBar);
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
      this.highlightBar.hideMenu();
      if ($(event.target).is(this.selectionElement.join(", "))) {
        event.stopPropagation();
      }
    });

    $(textLayer).on("mouseup.textSelectPluginHandler", (event) => {
      this.mouseIsDown = false;
      this.highlightBar.hideMenu();
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
      this.highlightBar.hideMenu();
    });

    // Prevent page flip on click
    $(textLayer).on('mouseup.textSelectPluginHandler', (event) => {
      this.mouseIsDown = false;
      if (event.which != 1) return;
      event.stopPropagation();
      this.highlightBar.showMenu();
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
  const highlightedText = selection.toString().replace(/[\s]+/g, " ").trim().split(" ");
  let textStart, textEnd; // :~:text=[prefix-,]textStart[,textEnd][,-suffix]
  const direction = selection.direction;
  const startNode = direction == 'backward' ? selection.focusNode : selection.anchorNode;
  const endNode = direction == 'backward' ? selection.anchorNode : selection.focusNode;
  // If text selection begins or ends with a space, we look for the next eligible word to serve as the start or end word
  const startWord = startNode.textContent.replace(/[\s]+/g, "") ? startNode.textContent : highlightedText[0];
  const endWord = endNode.textContent.replace(/[\s]+/g, "") ? endNode.textContent : highlightedText[highlightedText.length - 1];

  const textStartRe = RegExp.escape(startWord);
  const textEndRe = RegExp.escape(endWord);

  // 's' regex modifier ensures the `.` also captures newline characters
  const phraseMatchRe = new RegExp(String.raw`(?=(${textStartRe}).*?(?:(${textEndRe})))`, "gis");
  // Duplicated spaces in pageLayer.textContent for some reason
  const wholePageText = pageLayer.textContent.replaceAll("  ", " ");
  const foundMatches = wholePageText.matchAll(phraseMatchRe).toArray();
  if (foundMatches.length == 1) {
    // If `startWord...endWord` quote is unambiguous and only occurs once, no prefix-/-suffix is needed for the URL param
    return `text=${encodeURIComponent(startWord)},${encodeURIComponent(endWord)}`;
  }
  // Need to add some additional context to `startWord...endWord` by including surrounding words before and after the keywords
  const preStartRange = document.createRange();
  const postEndRange = document.createRange();
  if (direction == 'backward') {
    preStartRange.setStart(pageLayer.firstElementChild, 0);
    preStartRange.setEnd(selection.focusNode, 0);

    postEndRange.setStart(selection.anchorNode, selection.anchorNode.textContent.length);
    postEndRange.setEnd(pageLayer.lastElementChild, pageLayer.lastElementChild.childElementCount);

  } else {
    preStartRange.setStart(pageLayer.firstElementChild, 0);
    preStartRange.setEnd(selection.anchorNode, 0);

    postEndRange.setStart(selection.focusNode, selection.focusNode.textContent.length);
    postEndRange.setEnd(pageLayer.lastElementChild, pageLayer.lastElementChild.childElementCount);
  }

  // prefixes/suffixes cannot contain paragraph breaks, words that are from more than one line break away should not be included
  const prefixRe = new RegExp(String.raw`(\s+\S+){1,3}\s*?$`);
  const suffixRe = new RegExp(String.raw`^\S*?(\s+\S+){1,3}`);

  const textFragmentArr = [];
  let [prefixes, suffixes] = "";
  const getFirstWords = (sentence, patternRe) => {
    if (sentence.toString().match(patternRe)) {
      return sentence.toString().match(patternRe)[0];
    } else {
      return sentence.toString();
    }
  };

  if (getFirstWords(preStartRange, prefixRe)) {
    prefixes = `${getFirstWords(preStartRange.toString(), prefixRe)
      .replace(/[ ]+/g, " ")
      .trim()
      .replace(/^[^\n]*\n/gm, "")}-`;
  }
  if (getFirstWords(postEndRange, suffixRe)) {
    suffixes = `-${postEndRange.toString().match(suffixRe)[0]
      .replace(/[ ]+/g, " ")
      .trim()
      .replace(/\n[^\n]*$/gm, "")}`;
  }

  if (textStart === textEnd) {
    // if just one word ("Holmes") is selected, the browser API for text fragment will try to look for matches for strings like "Holmes, Holmes"
    // providing the prefix and suffix should be enough to locate it on the page
    textEnd = "";
  }

  // Partially selected words need to be captured completely
  const constructHighlight = selection.toString().replace(/[\s]+/g, " ").split(/[ ]+/g);
  if (direction == 'backward') {
    constructHighlight[0] = selection.focusNode.textContent;
    constructHighlight[constructHighlight.length - 1] = selection.anchorNode.textContent;
  } else {
    constructHighlight[0] = selection.anchorNode.textContent;
    constructHighlight[constructHighlight.length - 1] = selection.focusNode.textContent;
  }
  const fullHighlight = constructHighlight.join(" ").trim().split(" ");
  let quote = [fullHighlight.join(" ")];
  if (fullHighlight.length > 6) {
    quote = [fullHighlight.slice(0, 3).join(" "), fullHighlight.slice(-3).join(" ")];
  }
  if (prefixes) textFragmentArr.push(prefixes);
  textFragmentArr.push(...quote);
  if (suffixes.length != 0) {
    textFragmentArr.push(suffixes ? suffixes : "");
  }
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

@customElement('br-highlight-bar')
class BRSelectionMenu extends LitElement {
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
      <button @click=${this.handleCopyLinkToHighlight} class="textFragmentButton">
        <ia-icon-share aria-hidden="true"></ia-icon-share>
        <span class="menuOptionTitle">Copy Link to Highlight</span>
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
      navigator.clipboard.writeText(`${currentUrl.origin}${currentUrl.pathname}${currentParams}`);
    } else {
      navigator.clipboard.writeText(`${currentUrl.origin}${currentUrl.pathname}${currentParams}${currentUrl?.hash}`);
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
