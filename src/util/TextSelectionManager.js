// @ts-check
import { SelectionObserver } from "../BookReader/utils/SelectionObserver.js";

export class TextSelectionManager {
  hlightBarEl;
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
   * @param {'started' | 'cleared'} type
   * @param {HTMLElement} target
   */
  _onSelectionChange = (type, target) => {
    if (type === 'started') {
      this.textSelectingMode(target);
    } else if (type === 'cleared') {
      this.defaultMode(target);
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
      if ($(event.target).is(this.selectionElement.join(", "))) {
        event.stopPropagation();
      }
    });

    $(textLayer).on("mouseup.textSelectPluginHandler", (event) => {
      this.mouseIsDown = false;
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
      if (this.hlightBarEl) {
        this.hlightBarEl.remove();
        window.getSelection().empty(); // selection is checked at mouseup, cleared here to prevent button from lingering
      }
      event.stopPropagation();
    });

    // Prevent page flip on click
    $(textLayer).on('mouseup.textSelectPluginHandler', (event) => {
      this.mouseIsDown = false;
      event.stopPropagation();
      if (event.which != 1) return;
      this.hlightBarEl?.remove();
      if (window.getSelection().toString()) {
        this.highlightToolbar(event);
      } else {
        this.hlightBarEl?.remove();
      }
    });

    $(document.body).on('mouseup', (_) => {
      this.hlightBarEl?.remove();
    });
  }

  highlightToolbar(_) {
    const hlButton = document.createElement('button');

    if (this.hlightBarEl) {
      this.hlightBarEl.remove();
    }
    this.hlightBarEl = hlButton;
    const currentSelection = window.getSelection();
    const start = currentSelection.anchorNode.parentElement;
    const end = currentSelection.focusNode.parentElement; // will always be a text node
    const height = 30;
    const width = 60;
    const selectionTextLayer = start.closest('.BRtextLayer');
    const startBoundingRect = start.getBoundingClientRect();
    const endBoundingRect = end.getBoundingClientRect();
    let hlButtonTop = startBoundingRect.top - height;
    let hlButtonLeft = startBoundingRect.left - width;
    if (currentSelection.direction == 'backward') {
      hlButtonTop = endBoundingRect.top - height;
      hlButtonLeft = endBoundingRect.left - width;
    }
    hlButton.className = "textFragmentCopy";

    $(hlButton).css({
      'top': `${hlButtonTop}px`,
      'left': `${hlButtonLeft}px`,
      'width': `${width}px`,
      'height': `${height}px`,
      'position': 'absolute',
      'z-index': 1,
      'background': `url(..${this.br.imagesBaseURL}translate.svg)`,
      'background-position': 'center',
      'background-repeat': 'no-repeat',
      'background-color': 'darksalmon',
    });
    $(hlButton).on('mousedown', (event) => {
      event.stopPropagation();
      const currentUrl = window.location;
      const textContentParams = document.getSelection();
      let currentParams = this.br.readQueryString();
      if (currentParams.includes('text')) {
        currentParams = currentParams.replace(/(text=)[\w\W\d%]+/, createParam(textContentParams, selectionTextLayer));
      } else {
        currentParams = `${currentParams}&${createParam(document.getSelection(), selectionTextLayer)}`;
      }
      navigator.clipboard.writeText(`${currentUrl.origin}${currentUrl.pathname}${currentParams}${currentUrl?.hash}`);
    });

    $(hlButton).on('mouseup', (event) => {
      event.stopPropagation();
    });
    document.body.append(hlButton);
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
 *
 * @param {*} text - document.getSelection()
 * @param {*} pageLayer - anchorNode.parentElement.closest('.BRtextLayer')
 * @returns
 */
export function createParam(text, pageLayer = null) {
  const highlightedText = text.toString().replaceAll(/[\s]+/g, " ").trim().split(" ");
  const anchorWord = text.anchorNode.textContent;
  const focusWord = text.focusNode.textContent;
  let textStart, textEnd; // :~:text=[prefix-,]textStart[,textEnd][,-suffix]
  const direction = text.direction;

  // Duplicated spaces in pageLayer.textContent for some reason
  const wholePageText = pageLayer.textContent.replaceAll("  ", " ");
  if (direction == 'backward') {
    textStart = focusWord.replaceAll(/[\s]+/g, "") ? focusWord : highlightedText[0];
    textEnd = anchorWord.replaceAll(/[\s]+/g, "") ? anchorWord : highlightedText[highlightedText.length - 1];
  } else {
    textStart = anchorWord.replaceAll(/[\s]+/g, "") ? anchorWord : highlightedText[0];
    textEnd = focusWord.replaceAll(/[\s]+/g, "") ? focusWord : highlightedText[highlightedText.length - 1];
  }

  const escapedStart = RegExp.escape(textStart);
  const escapedEnd = RegExp.escape(textEnd);
  const testRegExp = new RegExp(String.raw`(?=(${escapedStart}).*?(?:(${escapedEnd})))`, "gi");

  const foundMatches = wholePageText.matchAll(testRegExp).toArray();
  if (foundMatches.length == 1) {
    return `text=${textStart},${textEnd}`;
  }
  const preStartRange = document.createRange();
  const postEndRange = document.createRange();
  if (direction == 'backward') {
    preStartRange.setStart(pageLayer.firstElementChild, 0);
    preStartRange.setEnd(text.focusNode, 0);

    postEndRange.setStart(text.anchorNode, text.anchorNode.textContent.length);
    postEndRange.setEnd(pageLayer.lastElementChild, pageLayer.lastElementChild.childElementCount);

  } else {
    preStartRange.setStart(pageLayer.firstElementChild, 0);
    preStartRange.setEnd(text.anchorNode, 0);

    postEndRange.setStart(text.focusNode, text.focusNode.textContent.length);
    postEndRange.setEnd(pageLayer.lastElementChild, pageLayer.lastElementChild.childElementCount);
  }

  const startRegex = new RegExp(String.raw`(\s+\S+){1,3}\s*?$`);
  const endRegex = new RegExp(String.raw`^\S*?(\s+\S+){1,3}`);
  // prefixes/suffixes cannot contain paragraph breaks
  const textFragmentArr = [];
  let [prefixes, suffixes] = ["", ""];
  if (preStartRange.toString().length !== 0) {
    if (!preStartRange.toString().match(startRegex)) {
      prefixes = `${preStartRange.toString()
        .replace(/[ ]+/g, " ")
        .trim()
        .replace(/^[^\n]*\n/gm, "")}-`;
    } else {
      prefixes = `${preStartRange.toString().match(startRegex)[0]
        .replace(/[ ]+/g, " ")
        .trim()
        .replace(/^[^\n]*\n/gm, "")}-`;
    }
    textFragmentArr.push(prefixes);
  }
  if (postEndRange.toString().length !== 0) {
    if (!postEndRange.toString().match(endRegex)) {
      suffixes = `-${postEndRange.toString()
        .replace(/[ ]+/g, " ")
        .trim()
        .replace(/^[^\n]*\n/gm, "")}`;
    } else {
      suffixes = `-${postEndRange.toString().match(endRegex)[0]
        .replace(/[ ]+/g, " ")
        .trim()
        .replace(/\n[^\n]*$/gm, "")}`;
    }
  }

  if (textStart === textEnd) {
    textEnd = "";
  }

  const selection = window.getSelection();
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
    if (direction == 'backward') {
      quote = [fullHighlight.slice(0, 3).join(" "), fullHighlight.slice(-3).join(" ")];
    } else {
      quote = [fullHighlight.slice(0, 3).join(" "), fullHighlight.slice(-3).join(" ")];
    }
  }
  textFragmentArr.push(...quote);
  if (suffixes.length != 0) {
    textFragmentArr.push(suffixes);
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


export class TextFragment {
  /** @type {string | null} */
  prefix
  /** @type {string} */
  textStart
  /** @type {string | null} */
  textEnd
  /** @type {string | null} */
  suffix

  /** @returns {string} */
  toString() {}

  /**
   * @param {string} urlString
   * @returns {TextFragment}
   **/
  static fromString(urlString) {}

  /**
   * @param {Selection} selection
   * @returns {TextFragment}
   */
  static fromSelection(selection) {}
}


/**
 * Prefix “That is easily-,
 * textstart %20 got.” “ And%20
 * Suffix - help.”“That is
*/
