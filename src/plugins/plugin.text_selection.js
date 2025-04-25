//@ts-check
import { createDIVPageLayer } from '../BookReader/PageContainer.js';
import { SelectionObserver } from '../BookReader/utils/SelectionObserver.js';
import { BookReaderPlugin } from '../BookReaderPlugin.js';
import { applyVariables } from '../util/strings.js';
/** @typedef {import('../util/strings.js').StringWithVars} StringWithVars */
/** @typedef {import('../BookReader/PageContainer.js').PageContainer} PageContainer */

const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);

/**
 * @template T
 */
export class Cache {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    /** @type {T[]} */
    this.entries = [];
  }

  /**
   * @param {T} entry
   */
  add(entry) {
    if (this.entries.length >= this.maxSize) {
      this.entries.shift();
    }
    this.entries.push(entry);
  }
}

export class TextSelectionPlugin extends BookReaderPlugin {
  options = {
    enabled: true,
    /** @type {StringWithVars} The URL to fetch the entire DJVU xml. Supports options.vars */
    fullDjvuXmlUrl: null,
    /** @type {StringWithVars} The URL to fetch a single page of the DJVU xml. Supports options.vars. Also has {{pageIndex}} */
    singlePageDjvuXmlUrl: null,
    /** Whether to fetch the XML as a jsonp */
    jsonp: false,
    /** Mox words tha can be selected when the text layer is protected */
    maxProtectedWords: 200,
  }

  /**@type {PromiseLike<JQuery<HTMLElement>|undefined>} */
  djvuPagesPromise = null;

  /** @type {Cache<{index: number, response: any}>} */
  pageTextCache = new Cache();

  /**
   * Sometimes there are too many words on a page, and the browser becomes near
   * unusable. For now don't render text layer for pages with too many words.
   */
  maxWordRendered = 2500;

  /**
   * @param {import('../BookReader.js').default} br
   */
  constructor(br) {
    super(br);
    // In the future this should be in the ocr file
    // since a book being right to left doesn't mean the ocr is right to left. But for
    // now we do make that assumption.
    /** Whether the book is right-to-left */
    this.rtl = this.br.pageProgression === 'rl';
    this.selectionObserver = new SelectionObserver('.BRtextLayer', this._onSelectionChange);
  }

  /** @override */
  init() {
    if (!this.options.enabled) return;

    this.loadData();

    this.selectionObserver.attach();
    new SelectionObserver('.BRtextLayer', (selectEvent) => {
      // Track how often selection is used
      if (selectEvent == 'started') {
        this.br.plugins.archiveAnalytics?.sendEvent('BookReader', 'SelectStart');

        // Set a class on the page to avoid hiding it when zooming/etc
        this.br.refs.$br.find('.BRpagecontainer--hasSelection').removeClass('BRpagecontainer--hasSelection');
        $(window.getSelection().anchorNode).closest('.BRpagecontainer').addClass('BRpagecontainer--hasSelection');
      }
    }).attach();

    if (this.br.protected) {
      document.addEventListener('selectionchange', this._limitSelection);
      // Prevent right clicking when selected text
      $(document.body).on('contextmenu dragstart copy', (e) => {
        const selection = document.getSelection();
        if (selection?.toString()) {
          const intersectsTextLayer = $('.BRtextLayer')
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
        (node) => node.classList?.contains('BRwordElement'),
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

  /**
   * @override
   * @param {PageContainer} pageContainer
   * @returns {PageContainer}
   */
  _configurePageContainer(pageContainer) {
    // Disable if thumb mode; it's too janky
    // .page can be null for "pre-cover" region
    if (this.br.mode !== this.br.constModeThumb && pageContainer.page) {
      this.createTextLayer(pageContainer);
    }
    return pageContainer;
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

  loadData() {
    // Only fetch the full djvu xml if the single page url isn't there
    if (this.options.singlePageDjvuXmlUrl) return;
    this.djvuPagesPromise = $.ajax({
      type: "GET",
      url: applyVariables(this.options.fullDjvuXmlUrl, this.br.options.vars),
      dataType: this.options.jsonp ? "jsonp" : "html",
      cache: true,
      xhrFields: {
        withCredentials: false,
      },
      error: (e) => undefined,
    }).then((res) => {
      try {
        const xmlMap = $.parseXML(res);
        return xmlMap && $(xmlMap).find("OBJECT");
      } catch (e) {
        return undefined;
      }
    });
  }

  /**
   * @param {number} index
   * @returns {Promise<HTMLElement|undefined>}
   */
  async getPageText(index) {
    if (this.options.singlePageDjvuXmlUrl) {
      const cachedEntry = this.pageTextCache.entries.find(x => x.index == index);
      if (cachedEntry) {
        return cachedEntry.response;
      }
      const res = await $.ajax({
        type: "GET",
        url: applyVariables(this.options.singlePageDjvuXmlUrl, this.br.options.vars, { pageIndex: index }),
        dataType: this.options.jsonp ? "jsonp" : "html",
        cache: true,
        xhrFields: {
          withCredentials: false,
        },
        error: (e) => undefined,
      });
      try {
        const xmlDoc = $.parseXML(res);
        const result = xmlDoc && $(xmlDoc).find("OBJECT")[0];
        this.pageTextCache.add({ index, response: result });
        return result;
      } catch (e) {
        return undefined;
      }
    } else {
      const XMLpagesArr = await this.djvuPagesPromise;
      if (XMLpagesArr) return XMLpagesArr[index];
    }
  }

  /**
   * Intercept copied text to remove any styling applied to it
   * @param {JQuery} $container
   */
  interceptCopy($container) {
    $container[0].addEventListener('copy', (event) => {
      const selection = document.getSelection();
      event.clipboardData.setData('text/plain', selection.toString());
      event.preventDefault();
    });
  }

  /**
   * Applies mouse events when in default mode
   * @param {HTMLElement} textLayer
   */
  defaultMode(textLayer) {
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
      if ($(event.target).is(".BRwordElement, .BRspace")) {
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

    $(textLayer).on('mousedown.textSelectPluginHandler', (event) => {
      this.mouseIsDown = true;
      event.stopPropagation();
    });

    // Prevent page flip on click
    $(textLayer).on('mouseup.textSelectPluginHandler', (event) => {
      this.mouseIsDown = false;
      event.stopPropagation();
    });
  }

  /**
   * Initializes text selection modes if there is a text layer on the page
   * @param {JQuery} $container
   */
  stopPageFlip($container) {
    /** @type {JQuery<HTMLElement>} */
    const $textLayer = $container.find('.BRtextLayer');
    if (!$textLayer.length) return;
    $textLayer.each((i, s) => this.defaultMode(s));
    if (!this.br.protected) {
      this.interceptCopy($container);
    }
  }

  /**
   * @param {PageContainer} pageContainer
   */
  async createTextLayer(pageContainer) {
    const pageIndex = pageContainer.page.index;
    const $container = pageContainer.$container;
    const $textLayers = $container.find('.BRtextLayer');
    if ($textLayers.length) return;
    const XMLpage = await this.getPageText(pageIndex);
    if (!XMLpage) return;
    recursivelyAddCoords(XMLpage);

    const totalWords = $(XMLpage).find("WORD").length;
    if (totalWords > this.maxWordRendered) {
      console.log(`Page ${pageIndex} has too many words (${totalWords} > ${this.maxWordRendered}). Not rendering text layer.`);
      return;
    }

    const textLayer = createDIVPageLayer(pageContainer.page, 'BRtextLayer');
    const ratioW = parseFloat(pageContainer.$container[0].style.width) / pageContainer.page.width;
    const ratioH = parseFloat(pageContainer.$container[0].style.height) / pageContainer.page.height;
    textLayer.style.transform = `scale(${ratioW}, ${ratioH})`;
    textLayer.setAttribute("dir", this.rtl ? "rtl" : "ltr");

    const ocrParagraphs = $(XMLpage).find("PARAGRAPH[coords]").toArray();
    const paragEls = ocrParagraphs.map(p => {
      const el = this.renderParagraph(p);
      textLayer.appendChild(el);
      return el;
    });

    // Fix up paragraph positions
    const paragraphRects = determineRealRects(textLayer, '.BRparagraphElement');
    let yAdded = 0;
    for (const [ocrParagraph, paragEl] of zip(ocrParagraphs, paragEls)) {
      const ocrParagBounds = $(ocrParagraph).attr("coords").split(",").map(parseFloat);
      const realRect = paragraphRects.get(paragEl);
      const [ocrLeft, , ocrRight, ocrTop] = ocrParagBounds;
      const newStartMargin = this.rtl ? (realRect.right - ocrRight) : (ocrLeft - realRect.left);
      const newTop = ocrTop - (realRect.top + yAdded);

      paragEl.style[this.rtl ? 'marginRight' : 'marginLeft'] = `${newStartMargin}px`;
      paragEl.style.marginTop = `${newTop}px`;
      yAdded += newTop;
      textLayer.appendChild(paragEl);
    }
    $container.append(textLayer);
    this.stopPageFlip($container);
  }

  /**
   * @param {HTMLElement} ocrParagraph
   * @returns {HTMLParagraphElement}
   */
  renderParagraph(ocrParagraph) {
    const paragEl = document.createElement('p');
    paragEl.classList.add('BRparagraphElement');
    const [paragLeft, paragBottom, paragRight, paragTop] = $(ocrParagraph).attr("coords").split(",").map(parseFloat);
    const wordHeightArr = [];
    const lines = $(ocrParagraph).find("LINE[coords]").toArray();
    if (!lines.length) return paragEl;


    for (const [prevLine, line, nextLine] of lookAroundWindow(genMap(lines, augmentLine))) {
      const isLastLineOfParagraph = line.ocrElement == lines[lines.length - 1];
      const lineEl = document.createElement('span');
      lineEl.classList.add('BRlineElement');

      for (const [wordIndex, currWord] of line.words.entries()) {
        const [, bottom, right, top] = $(currWord).attr("coords").split(',').map(parseFloat);
        const wordHeight = bottom - top;
        wordHeightArr.push(wordHeight);

        if (wordIndex == 0 && prevLine?.lastWord.textContent.trim().endsWith('-')) {
          // ideally prefer the next line to determine the left position,
          // since the previous line could be the first line of the paragraph
          // and hence have an incorrectly indented first word.
          // E.g. https://archive.org/details/driitaleofdaring00bachuoft/page/360/mode/2up
          const [newLeft, , , ] = $((nextLine || prevLine).firstWord).attr("coords").split(',').map(parseFloat);
          $(currWord).attr("coords", `${newLeft},${bottom},${right},${top}`);
        }

        const wordEl = document.createElement('span');
        wordEl.setAttribute("class", "BRwordElement");
        wordEl.textContent = currWord.textContent.trim();

        if (wordIndex > 0) {
          const space = document.createElement('span');
          space.classList.add('BRspace');
          space.textContent = ' ';
          lineEl.append(space);

          // Edge ignores empty elements (like BRspace), so add another
          // space to ensure Edge's ReadAloud works correctly.
          lineEl.appendChild(document.createTextNode(' '));
        }

        lineEl.appendChild(wordEl);
      }

      const hasHyphen = line.lastWord.textContent.trim().endsWith('-');
      const lastWordEl = lineEl.children[lineEl.children.length - 1];
      if (hasHyphen && !isLastLineOfParagraph) {
        lastWordEl.textContent = lastWordEl.textContent.trim().slice(0, -1);
        lastWordEl.classList.add('BRwordElement--hyphen');
      }

      paragEl.appendChild(lineEl);
      if (!isLastLineOfParagraph && !hasHyphen) {
        // Edge does not correctly have spaces between the lines.
        paragEl.appendChild(document.createTextNode(' '));
      }
    }

    wordHeightArr.sort((a, b) => a - b);
    const paragWordHeight = wordHeightArr[Math.floor(wordHeightArr.length * 0.85)] + 4;
    paragEl.style.left = `${paragLeft}px`;
    paragEl.style.top = `${paragTop}px`;
    paragEl.style.width = `${paragRight - paragLeft}px`;
    paragEl.style.height = `${paragBottom - paragTop}px`;
    paragEl.style.fontSize = `${paragWordHeight}px`;

    // Fix up sizes - stretch/crush words as necessary using letter spacing
    let wordRects = determineRealRects(paragEl, '.BRwordElement');
    const ocrWords = $(ocrParagraph).find("WORD").toArray();
    const wordEls = paragEl.querySelectorAll('.BRwordElement');
    for (const [ocrWord, wordEl] of zip(ocrWords, wordEls)) {
      const realRect = wordRects.get(wordEl);
      const [left, , right ] = $(ocrWord).attr("coords").split(',').map(parseFloat);
      let ocrWidth = right - left;
      // Some books (eg theworksofplato01platiala) have a space _inside_ the <WORD>
      // element. That makes it impossible to determine the correct positining
      // of everything, but to avoid the BRspace's being width 0, which makes selection
      // janky on Chrome Android, assume the space is the same width as one of the
      // letters.
      if (ocrWord.textContent.endsWith(' ')) {
        ocrWidth = ocrWidth * (ocrWord.textContent.length - 1) / ocrWord.textContent.length;
      }
      const diff = ocrWidth - realRect.width;
      wordEl.style.letterSpacing = `${diff / (ocrWord.textContent.length - 1)}px`;
    }

    // Stretch/crush lines as necessary using line spacing
    // Recompute rects after letter spacing
    wordRects = determineRealRects(paragEl, '.BRwordElement');
    const spaceRects = determineRealRects(paragEl, '.BRspace');

    const ocrLines = $(ocrParagraph).find("LINE[coords]").toArray();
    const lineEls = Array.from(paragEl.querySelectorAll('.BRlineElement'));

    let ySoFar = paragTop;
    for (const [ocrLine, lineEl] of zip(ocrLines, lineEls)) {
      // shift words using marginLeft to align with the correct x position
      const words = $(ocrLine).find("WORD").toArray();
      // const ocrLineLeft = Math.min(...words.map(w => parseFloat($(w).attr("coords").split(',')[0])));
      let xSoFar = this.rtl ? paragRight : paragLeft;
      for (const [ocrWord, wordEl] of zip(words, lineEl.querySelectorAll('.BRwordElement'))) {
        // start of line, need to compute the offset relative to the OCR words
        const wordRect = wordRects.get(wordEl);
        const [ocrLeft, , ocrRight ] = $(ocrWord).attr("coords").split(',').map(parseFloat);
        const diff = (this.rtl ? -(ocrRight - xSoFar) : ocrLeft - xSoFar);

        if (wordEl.previousElementSibling) {
          const space = wordEl.previousElementSibling;
          space.style.letterSpacing = `${diff - spaceRects.get(space).width}px`;
        } else {
          wordEl.style[this.rtl ? 'paddingRight' : 'paddingLeft'] = `${diff}px`;
        }
        if (this.rtl) xSoFar -= diff + wordRect.width;
        else xSoFar += diff + wordRect.width;
      }
      // And also fix y position
      const ocrLineTop = Math.min(...words.map(w => parseFloat($(w).attr("coords").split(',')[3])));
      const diff = ocrLineTop - ySoFar;
      if (lineEl.previousElementSibling) {
        lineEl.previousElementSibling.style.lineHeight = `${diff}px`;
        ySoFar += diff;
      }
    }

    // The last line will have a line height subtracting from the paragraph height
    lineEls[lineEls.length - 1].style.lineHeight = `${paragBottom - ySoFar}px`;

    // Edge does not include a newline for some reason when copying/pasting the <p> els
    paragEl.appendChild(document.createElement('br'));
    return paragEl;
  }
}

BookReader?.registerPlugin('textSelection', TextSelectionPlugin);


/**
 * @param {HTMLElement} parentEl
 * @param {string} selector
 * @returns {Map<Element, Rect>}
 */
function determineRealRects(parentEl, selector) {
  const initals = {
    position: parentEl.style.position,
    visibility: parentEl.style.visibility,
    top: parentEl.style.top,
    left: parentEl.style.left,
    transform: parentEl.style.transform,
  };
  parentEl.style.position = 'absolute';
  parentEl.style.visibility = 'hidden';
  parentEl.style.top = '0';
  parentEl.style.left = '0';
  parentEl.style.transform = 'none';
  document.body.appendChild(parentEl);
  const rects = new Map(
    Array.from(parentEl.querySelectorAll(selector))
      .map(wordEl => {
        const origRect = wordEl.getBoundingClientRect();
        return [wordEl, new Rect(
          origRect.left + window.scrollX,
          origRect.top + window.scrollY,
          origRect.width,
          origRect.height,
        )];
      }),
  );
  document.body.removeChild(parentEl);
  Object.assign(parentEl.style, initals);
  return rects;
}

/**
 * @param {HTMLElement} line
 */
function augmentLine(line) {
  const words = $(line).find("WORD").toArray();
  return {
    ocrElement: line,
    words,
    firstWord: words[0],
    lastWord: words[words.length - 1],
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
    if (i == index) return x;
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
 * @template TFrom, TTo
 * Generator version of map
 * @param {Iterable<TFrom>} gen
 * @param {function(TFrom): TTo} fn
 * @returns {Iterable<TTo>}
 */
export function* genMap(gen, fn) {
  for (const x of gen) yield fn(x);
}

/**
 * @template T
 * Generator that provides a sliding window of 3 elements,
 * prev, current, and next.
 * @param {Iterable<T>} gen
 * @returns {Iterable<[T | undefined, T, T | undefined]>}
 */
export function* lookAroundWindow(gen) {
  let prev = undefined;
  let cur = undefined;
  let next = undefined;
  for (const x of gen) {
    if (typeof cur !== 'undefined') {
      next = x;
      yield [prev, cur, next];
    }
    prev = cur;
    cur = x;
    next = undefined;
  }

  if (typeof cur !== 'undefined') {
    yield [prev, cur, next];
  }
}

/**
 * @template T1, T2
 * Lazy zip implementation to avoid importing lodash
 * Expects iterators to be of the same length
 * @param {Iterable<T1>} gen1
 * @param {Iterable<T2>} gen2
 * @returns {Iterable<[T1, T2]>}
 */
export function* zip(gen1, gen2) {
  const it1 = gen1[Symbol.iterator]();
  const it2 = gen2[Symbol.iterator]();
  while (true) {
    const r1 = it1.next();
    const r2 = it2.next();
    if (r1.done && r2.done) {
      return;
    }
    if (r1.done || r2.done) {
      throw new Error('zip: one of the iterators is done');
    }
    yield [r1.value, r2.value];
  }
}

/**
 * [left, bottom, right, top]
 * @param {Array<[number, number, number, number]>} bounds
 * @returns {[number, number, number, number]}
 */
function determineBounds(bounds) {
  let leftMost = Infinity;
  let bottomMost = -Infinity;
  let rightMost = -Infinity;
  let topMost = Infinity;

  for (const [left, bottom, right, top] of bounds) {
    leftMost = Math.min(leftMost, left);
    bottomMost = Math.max(bottomMost, bottom);
    rightMost = Math.max(rightMost, right);
    topMost = Math.min(topMost, top);
  }

  return [leftMost, bottomMost, rightMost, topMost];
}

/**
 * Recursively traverses the XML tree and adds coords
 * which are the bounding box of all child coords
 * @param {Element} xmlEl
 */
function recursivelyAddCoords(xmlEl) {
  if ($(xmlEl).attr('coords') || !xmlEl.children) {
    return;
  }

  const children = $(xmlEl).children().toArray();
  if (children.length === 0) {
    return;
  }

  for (const child of children) {
    recursivelyAddCoords(child);
  }

  const childCoords = [];

  for (const child of children) {
    if (!$(child).attr('coords')) continue;
    childCoords.push($(child).attr('coords').split(',').map(parseFloat));
  }

  const boundingCoords = determineBounds(childCoords);
  if (Math.abs(boundingCoords[0]) != Infinity) {
    $(xmlEl).attr('coords', boundingCoords.join(','));
  }
}

/**
 * Basically a polyfill for the native DOMRect class
 */
class Rect {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get right() { return this.x + this.width; }
  get bottom() { return this.y + this.height; }
  get top() { return this.y; }
  get left() { return this.x; }
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
