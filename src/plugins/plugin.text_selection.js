//@ts-check
import { createDIVPageLayer } from '../BookReader/PageContainer.js';
import { median } from '../BookReader/utils.js';
import { SelectionObserver } from '../BookReader/utils/SelectionObserver.js';
import { applyVariables } from '../util/strings.js';
/** @typedef {import('../util/strings.js').StringWithVars} StringWithVars */
/** @typedef {import('../BookReader/PageContainer.js').PageContainer} PageContainer */

const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);

export const DEFAULT_OPTIONS = {
  enabled: true,
  /** @type {StringWithVars} The URL to fetch the entire DJVU xml. Supports options.vars */
  fullDjvuXmlUrl: null,
  /** @type {StringWithVars} The URL to fetch a single page of the DJVU xml. Supports options.vars. Also has {{pageIndex}} */
  singlePageDjvuXmlUrl: null,
  /** Whether to fetch the XML as a jsonp */
  jsonp: false,
};
/** @typedef {typeof DEFAULT_OPTIONS} TextSelectionPluginOptions */

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

export class TextSelectionPlugin {
  /**
   * @param {'lr' | 'rl'} pageProgression In the future this should be in the ocr file
   * since a book being right to left doesn't mean the ocr is right to left. But for
   * now we do make that assumption.
   */
  constructor(options = DEFAULT_OPTIONS, optionVariables, pageProgression = 'lr') {
    this.options = options;
    this.optionVariables = optionVariables;
    /**@type {PromiseLike<JQuery<HTMLElement>|undefined>} */
    this.djvuPagesPromise = null;
    /** Whether the book is right-to-left */
    this.rtl = pageProgression === 'rl';

    /** @type {Cache<{index: number, response: any}>} */
    this.pageTextCache = new Cache();

    /**
     * Sometimes there are too many words on a page, and the browser becomes near
     * unusable. For now don't render text layer for pages with too many words.
     */
    this.maxWordRendered = 2500;

    this.selectionObserver = new SelectionObserver('.BRtextLayer', this._onSelectionChange);
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

  init() {
    this.selectionObserver.attach();

    // Only fetch the full djvu xml if the single page url isn't there
    if (this.options.singlePageDjvuXmlUrl) return;
    this.djvuPagesPromise = $.ajax({
      type: "GET",
      url: applyVariables(this.options.fullDjvuXmlUrl, this.optionVariables),
      dataType: this.options.jsonp ? "jsonp" : "html",
      cache: true,
      error: (e) => undefined
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
        url: applyVariables(this.options.singlePageDjvuXmlUrl, this.optionVariables, { pageIndex: index }),
        dataType: this.options.jsonp ? "jsonp" : "html",
        cache: true,
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
    this.interceptCopy($container);
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

    // Try to detect centered paragraphs
    const medianLeft = median(
      $(XMLpage).find("LINE").toArray()
        .map(l => parseFloat($(l).attr("coords")?.split(',')?.[0]))
        .filter(x => !isNaN(x))
    );
    const medianRightDist = pageContainer.page.width - median(
      $(XMLpage).find("LINE").toArray()
        .map(l => parseFloat($(l).attr("coords")?.split(',')?.[2]))
        .filter(x => !isNaN(x))
    )

    for (const paragEl of paragEls) {
      const lines = Array.from(paragEl.querySelectorAll('.BRlineElement'));
      const isCentered = lines.length >= 1 && lines.every(line => {
        const left = parseFloat(paragEl.style.left);
        const right = parseFloat(paragEl.style.left) + parseFloat(paragEl.style.width);
        const rightDist = pageContainer.page.width - right;
        return (left > medianLeft * 1.8 && rightDist > medianRightDist * 1.8) && left < pageContainer.page.width / 2;
      });
      if (isCentered) {
        paragEl.classList.add('BRcentered');
      }
    }

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
        // Set confidence for potential styling
        const confidence = parseFloat($(currWord).attr("x-confidence"));
        wordEl.setAttribute("style", `--br-conf: ${confidence}%`);
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

      const hasHyphen = line.lastWord.textContent.trim().endsWith('-') || line.lastWord.textContent.trim().endsWith('¬');
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

export class BookreaderWithTextSelection extends BookReader {
  init() {
    const options = Object.assign({}, DEFAULT_OPTIONS, this.options.plugins.textSelection);
    if (options.enabled) {
      this.textSelectionPlugin = new TextSelectionPlugin(options, this.options.vars, this.pageProgression);
      // Write this back; this way the plugin is the source of truth, and BR just
      // contains a reference to it.
      this.options.plugins.textSelection = options;
      this.textSelectionPlugin.init();

      new SelectionObserver('.BRtextLayer', (selectEvent) => {
        // Track how often selection is used
        if (selectEvent == 'started') {
          this.archiveAnalyticsSendEvent?.('BookReader', 'SelectStart');

          // Set a class on the page to avoid hiding it when zooming/etc
          this.refs.$br.find('.BRpagecontainer--hasSelection').removeClass('BRpagecontainer--hasSelection');
          $(window.getSelection().anchorNode).closest('.BRpagecontainer').addClass('BRpagecontainer--hasSelection');
        }
      }).attach();
    }

    super.init();
  }

  /**
   * @param {number} index
   */
  _createPageContainer(index) {
    const pageContainer = super._createPageContainer(index);
    // Disable if thumb mode; it's too janky
    // .page can be null for "pre-cover" region
    if (this.mode !== this.constModeThumb && pageContainer.page) {
      pageContainer.textSelectionLoadingComplete = this.textSelectionPlugin?.createTextLayer(pageContainer);
    }
    return pageContainer;
  }
}
window.BookReader = BookreaderWithTextSelection;
export default BookreaderWithTextSelection;


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
      })
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
