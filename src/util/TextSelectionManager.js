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
        window.getSelection().empty(); // selection is checked at mouseup, need to clear it here to prevent button from lingering
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
    const start = currentSelection.anchorNode.parentElement
    const end = currentSelection.focusNode.parentElement // will always be a text node
    const selectionTextLayer = start.closest('.BRtextLayer'); 
    const endBoundingRect = end.getBoundingClientRect();
    const width = 60;
    const height = 30;
    let hlButtonTop = endBoundingRect.top;
    let hlButtonLeft = endBoundingRect.left;
    if (currentSelection.direction == 'backward') {
      hlButtonTop -= (height + start.getBoundingClientRect().height);
    } else {
      hlButtonTop += (height / 2);
      hlButtonLeft += (width / 2);
    }
    hlButton.className = "FINDME";

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
    })
    $(hlButton).on('mousedown', (event) => {
      event.stopPropagation();
      let currentUrl = window.location;
      const textContentParams = document.getSelection()
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
    })
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
  function findContext(startLine, endLine) {
    if (window.getSelection().direction == 'backward') {
      const tempWords = startLine;
      startLine = endLine;
      endLine = tempWords;
    }
    const surroundingStart = text.anchorNode.parentElement.closest(".BRlineElement");
    const surroundingEnd = text.focusNode.parentElement.closest(".BRlineElement");
    /** if (surroundingStart === surroundingEnd) {
    //   // If the selection has the same line
    //   const parentLineArray = surroundingStart.textContent.split(/[\s]+/);
    //   let startIdx = parentLineArray.indexOf(startLine);
    //   let endIdx = parentLineArray.indexOf(endLine);
    //   let beforeStart, afterEnd;

    //   if (window.getSelection().direction == 'backward') {
    //     beforeStart = startIdx + 3 >= parentLineArray.length ? parentLineArray.length : startIdx + 3;
    //     afterEnd = endIdx - 2 < 0 ? endIdx : endIdx - 2;
    //   } else {
    //     beforeStart = startIdx - 2 < 0 ? startIdx : startIdx - 2;
    //     afterEnd = endIdx + 3 >= parentLineArray.length ? parentLineArray.length : endIdx + 3;
    //   }
    //   const beforeStartWords = parentLineArray.slice(beforeStart, startIdx).join(" ");
    //   const afterEndWords = parentLineArray.slice(endIdx + 1, afterEnd).join(" ");

    //   const prefixURI = beforeStartWords ? `${encodeURIComponent(beforeStartWords)}-,` : ""
    //   const suffixURI = afterEndWords ? `,-${encodeURIComponent(afterEndWords)}` : ""
    //   return `text=${prefixURI}${encodeURIComponent(removeNewLine.join(" "))}${suffixURI}`
      } else { 
    */
      // If the selection is across multiple lines
      let parentStartLineArray = surroundingStart.textContent.split(/[\s]+/);
      let parentEndLineArray = surroundingEnd.textContent.split(/[\s]+/);
      // console.log("parentStartLineArray", parentStartLineArray);
      let startIdx = parentStartLineArray.indexOf(startLine);
      let endIdx = parentEndLineArray.indexOf(endLine);
      // console.log("this is the start and end", startIdx, endIdx, parentEndLineArray);
      if (startIdx == 0) {
        if (!surroundingStart.previousElementSibling) {
          let previousParagraph = Array.from(surroundingStart.parentElement.previousElementSibling.childNodes).filter((ele) => ele.className == 'BRlineElement');
          parentStartLineArray = previousParagraph.slice(-1)[0].textContent.split(/[\s]+/);
        } else {
          parentStartLineArray = surroundingStart.previousElementSibling.textContent.split(/[\s]+/);
        }
        startIdx = parentStartLineArray.length + 1;
      }
      if (endIdx + 1 == parentEndLineArray.length) { // Need to check the next line
        if (surroundingEnd.nextSibling.className != 'BRlineElement') {
          let nextParagraph = Array.from(surroundingEnd.parentElement.nextSibling.childNodes).filter((ele) => ele.className == 'BRlineElement');
          parentEndLineArray = nextParagraph.slice(0)[0].textContent.split(/[\s]+/);
        } else {
          parentEndLineArray = surroundingEnd.nextSibling.textContent.split(/[\s]+/);
        }
        endIdx = -1;
      }
      // console.log("this is parentStartLineArray", parentStartLineArray);
      let beforeStart = startIdx - 2 <= 0 ? 0 : startIdx - 2;
      let afterEnd = endIdx + 3 >= parentEndLineArray.length ? parentEndLineArray.length : endIdx + 3;
      if (window.getSelection().direction == "backward") {
        beforeStart = endIdx - 2 <= 0 ? 0 : endIdx - 2;
        afterEnd = startIdx + 3 >= parentStartLineArray.length ? parentStartLineArray.length : startIdx + 3;
        // console.log("reversing the indexes", 
        //   `beforeStart: ${beforeStart},
        //   afterEnd: ${afterEnd},
        //   startIdx: ${startIdx}, ${parentStartLineArray[startIdx]},
        //   endIdx: ${endIdx}, ${parentEndLineArray[endIdx]},
        //   preStartWords = ${parentStartLineArray.slice(beforeStart, startIdx)},
        //   ${parentStartLineArray};
        //   `);
      }
      const preStartWords = parentStartLineArray.slice(beforeStart, startIdx).join (" ");
      const postEndWords = parentEndLineArray.slice(endIdx + 1, afterEnd).join(" ");
      // console.log("removeNewLine", highlightedText);
      // console.log("beforeStart, afterEnd", beforeStart, afterEnd);
      // console.log("should show quote", parentStartLineArray, beforeStart, startIdx);

      // console.log("highlighted text", highlightedText);
      const prefixURI = preStartWords ? `${encodeURIComponent(preStartWords)}-,` : "";
      const suffixURI = postEndWords ? `,-${encodeURIComponent(postEndWords)}` : ""
      return `text=${prefixURI}${encodeURIComponent(highlightedText.join(" "))}${suffixURI}`;
    // }
    
  }
  if (pageLayer) {
    // Duplicated spaces in pageLayer.textContent for some reason
    const wholePageText = pageLayer.textContent.replaceAll("  ", " ");
    if (direction == 'backward') {
      textStart = focusWord.replaceAll(/[\s]+/g, "") ? focusWord: highlightedText[0]
      textEnd = anchorWord.replaceAll(/[\s]+/g, "") ? anchorWord : highlightedText[highlightedText.length - 1];
    } else {
      textStart = anchorWord.replaceAll(/[\s]+/g, "")? anchorWord : highlightedText[0]
      textEnd = focusWord.replaceAll(/[\s]+/g, "") ? focusWord : highlightedText[highlightedText.length - 1];
    }
    const escapedStart = RegExp.escape(textStart);
    const escapedEnd = RegExp.escape(textEnd);
    const testRegExp = new RegExp(String.raw`(?=(${escapedStart}).*?(?:(${escapedEnd})))`, "gi")
    // const testRegExp = new RegExp(String.raw`(\S+\s+){3}${escapedStart}[\s\S]*?${escapedEnd}(\s+\S+){3}`, "gi");
    /** otherRegExp probably doesn't work; textContent doesn't preserve newlines and innerText jumbles lines within paragraphs
     * const otherRegExp = new RegExp(String.raw`(\S+\s){3}${escapedStart}.*?${escapedEnd}(\s\S+){3}`, "gi")
     * console.log("otherRegExp", otherRegExp);
     * const surroundingFoundMatches = pageLayer.innerText.replaceAll(/[\s+]/g, " ").matchAll(otherRegExp).toArray();
     * console.log("surroundingFoundMatches", surroundingFoundMatches);
    */
    // const foundMatches = wholePageText.matchAll(testRegExp).toArray();
    // console.log("this is foundMatches", foundMatches, textStart, textEnd);
    // if (foundMatches.length == 1) {
      // should be safe to use the match that was found here
      // console.log("found a unique match from just the page");
      // return `text=${textStart},${textEnd}`;
    // } else {
      let preStartRange = document.createRange();
      let postEndRange = document.createRange();
      if (direction == 'backward') {
        // preStartRange.setStart(text.focusNode, text.focusNode.textContent.length);
        // preStartRange.setEnd(pageLayer.lastElementChild, pageLayer.lastElementChild);

        // postEndRange.setEnd(text.anchorNode, 0);
        // postEndRange.setStart(pageLayer.firstElementChild, 0);
        preStartRange.setStart(pageLayer.firstElementChild, 0);
        preStartRange.setEnd(text.focusNode, 0);

        postEndRange.setStart(text.anchorNode, text.anchorNode.textContent.length);
        postEndRange.setEnd(pageLayer.lastElementChild, pageLayer.lastElementChild.childElementCount)

      } else {
        preStartRange.setStart(pageLayer.firstElementChild, 0);
        preStartRange.setEnd(text.anchorNode, 0);

        postEndRange.setStart(text.focusNode, text.focusNode.textContent.length);
        postEndRange.setEnd(pageLayer.lastElementChild, pageLayer.lastElementChild.childElementCount);
      }
      console.log("preStartRange", preStartRange.toString());
      console.log("postEndRange", postEndRange.toString());
      
      let startRegex = new RegExp(String.raw`(\s+\S+){3}\s*?$`)
      let endRegex = new RegExp(String.raw`^\S*?(\s+\S+){3}`);
      // prefixes/suffixes cannot contain paragraph breaks
      let prefixes = preStartRange.toString().match(startRegex)[0]
        .replace(/[ ]+/g, " ")
        .trim()
        .replace(/^[^\n]*\n/gm, "");
      console.log(postEndRange.toString().match(endRegex));
      let suffixes = postEndRange.toString().match(endRegex)[0]
        .replace(/[ ]+/g, " ")
        .trim()
        .replace(/\n[^\n]*$/gm, "");
      // console.log("prefixes", prefixes);
      // console.log("suffixes", suffixes);

      // console.log(textStart, textEnd);
      if (textStart === textEnd) {
        console.log("these are the same things");
        textEnd = "";
      }

      const selection = window.getSelection();
      let constructHighlight = selection.toString().replace(/[\s]+/g, " ").split(/[ ]+/g);
      console.log({constructHighlight});
      if (direction == 'backward') {
        constructHighlight[0] = selection.focusNode.textContent;
        constructHighlight[constructHighlight.length - 1] = selection.anchorNode.textContent;
      } else {
        constructHighlight[0] = selection.anchorNode.textContent;
        constructHighlight[constructHighlight.length - 1] = selection.focusNode.textContent;
      }
      const fullHighlight = constructHighlight.join(" ").trim().split(" ");
      console.log({fullHighlight});
      let quote = [fullHighlight.join(" ")];
      if (fullHighlight.length > 6) {
        console.log("this is fullHighlight.length", fullHighlight.length, direction);
        if (direction == 'backward') {
          console.log("why is this not showing in the console")
          console.log("this is backwards", fullHighlight.slice(-3).join(' '));
          console.log("other backwards half", fullHighlight.slice(0, 3).join(" "));
          quote = [fullHighlight.slice(0, 3).join(" "), fullHighlight.slice(-3).join(" ")];
        } else {
          console.log(fullHighlight.slice(0, 3).join(" "))
          console.log("negative slice", fullHighlight.slice(-3), fullHighlight.slice(-1), fullHighlight.slice(-2));
          quote = [fullHighlight.slice(0, 3).join(" "), fullHighlight.slice(-3).join(" ")];
        }
      }
      console.log({prefixes, quote, suffixes});
      
      // highlight can also not contain newline characters
      console.log(fullHighlight.join(' '));
      return `text=${[
        `${prefixes}-`,
        ...quote,
        `-${suffixes}`,
      ].map(encodeURIComponent).join(',')}`;
    // }
    return findContext(textStart, textEnd);
    }

    return findContext(textStart, textEnd);
  // }
  console.log("Last case scenario: Attempt to use whole line", `${highlightedText.join(" ")}`);
  return `text=${encodeURIComponent(highlightedText.join(" "))}`
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