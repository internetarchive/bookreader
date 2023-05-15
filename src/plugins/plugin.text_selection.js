//@ts-check
import { createDIVPageLayer } from '../BookReader/PageContainer.js';
import { SelectionStartedObserver } from '../BookReader/utils/SelectionStartedObserver.js';
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
  /** @type {'djvu' | 'hocr'} */
  format: 'djvu',
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

  constructor(options = DEFAULT_OPTIONS, optionVariables) {
    this.options = options;
    this.optionVariables = optionVariables;
    /**@type {PromiseLike<JQuery<HTMLElement>|undefined>} */
    this.djvuPagesPromise = null;

    /** @type {Cache<{index: number, response: any}>} */
    this.pageTextCache = new Cache();

    /**
     * Sometimes there are too many words on a page, and the browser becomes near
     * unusable. For now don't render text layer for pages with too many words.
     */
    this.maxWordRendered = 2500;
  }

  init() {
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
    $pageContainer.removeClass("BRpagecontainer--selecting");
    $(textLayer).on("mousedown.textSelectPluginHandler", (event) => {
      if (!$(event.target).is(".BRwordElement")) return;
      event.stopPropagation();
      $pageContainer.addClass("BRpagecontainer--selecting");
      $(textLayer).one("mouseup.textSelectPluginHandler", (event) => {
        if (window.getSelection().toString() != "") {
          event.stopPropagation();
          $(textLayer).off(".textSelectPluginHandler");
          this.textSelectingMode(textLayer);
        } else {
          $pageContainer.removeClass("BRpagecontainer--selecting");
        }
      });
    });
  }

  /**
   * Applies mouse events when in textSelecting mode
   * @param {HTMLElement} textLayer
   */
  textSelectingMode(textLayer) {
    $(textLayer).on('mousedown.textSelectPluginHandler', (event) => {
      if (!$(event.target).is(".BRwordElement")) {
        if (window.getSelection().toString() != "") window.getSelection().removeAllRanges();
      }
      event.stopPropagation();
    });
    $(textLayer).on('mouseup.textSelectPluginHandler', (event) => {
      event.stopPropagation();
      if (window.getSelection().toString() == "") {
        $(textLayer).off(".textSelectPluginHandler");
        this.defaultMode(textLayer);      }
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

    const totalWords = $(XMLpage).find("WORD").length;
    if (totalWords > this.maxWordRendered) {
      console.log(`Page ${pageIndex} has too many words (${totalWords} > ${this.maxWordRendered}). Not rendering text layer.`);
      return;
    }

    const textLayer = createDIVPageLayer(pageContainer.page, 'BRtextLayer');
    const ratioW = parseFloat(pageContainer.$container[0].style.width) / pageContainer.page.width;
    const ratioH = parseFloat(pageContainer.$container[0].style.height) / pageContainer.page.height;
    textLayer.style.transform = `scale(${ratioW}, ${ratioH})`;
    $container.append(textLayer);

    for (const ocrParagraph of $(XMLpage).find("PARAGRAPH")) {
      textLayer.appendChild(this.renderParagraph(ocrParagraph));
    }
    this.stopPageFlip($container);
  }

  /**
   * @param {HTMLElement} ocrParagraph
   * @returns {HTMLParagraphElement}
   */
  renderParagraph(ocrParagraph) {
    const paragEl = document.createElement('p');
    paragEl.classList.add('BRparagraphElement');
    const wordHeightArr = [];
    const lines = $(ocrParagraph).find("LINE").toArray();
    if (!lines.length) return paragEl;

    let paragLeft = Infinity;
    let paragTop = Infinity;
    let paragRight = 0;
    let paragBottom = 0;

    for (const [prevLine, line, nextLine] of lookAroundWindow(genMap(lines, augmentLine))) {
      const isLastLineOfParagraph = line.ocrElement == lines[lines.length - 1];
      const lineEl = document.createElement('span');
      lineEl.classList.add('BRlineElement');

      for (const [wordIndex, currWord] of line.words.entries()) {
        const isLastWordOfLine = currWord === line.words[line.words.length - 1];
        // eslint-disable-next-line no-unused-vars
        const [left, bottom, right, top] = $(currWord).attr("coords").split(',').map(parseFloat);
        paragLeft = Math.min(paragLeft, left);
        paragTop = Math.min(paragTop, top);
        paragRight = Math.max(paragRight, right);
        paragBottom = Math.max(paragBottom, bottom);
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

        // wordEl.setAttribute("title", currWord.outerHTML);
        wordEl.textContent = currWord.textContent.trim();

        const hasHyphen = currWord.textContent.trim().endsWith('-');
        lineEl.appendChild(wordEl);
        if (isLastWordOfLine && !isLastLineOfParagraph && hasHyphen) {
          wordEl.textContent = wordEl.textContent.trim().slice(0, -1);
          wordEl.classList.add('BRwordElement--hyphen');
        }

        if ((isLastLineOfParagraph && isLastWordOfLine) || (isLastWordOfLine && hasHyphen)) {
          // Don't add a space
        } else {
          const space = document.createElement('span');
          space.classList.add('BRspace');
          space.textContent = ' ';
          lineEl.append(space);
        }
      }

      paragEl.appendChild(lineEl);
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
      const ocrWidth = right - left;
      const diff = ocrWidth - realRect.width;
      wordEl.style.letterSpacing = `${diff / (ocrWord.textContent.length - 1)}px`;
    }

    // Stretch/crush lines as necessary using line spacing
    // Recompute rects after letter spacing
    wordRects = determineRealRects(paragEl, '.BRwordElement');
    const spaceRects = determineRealRects(paragEl, '.BRspace');

    const ocrLines = $(ocrParagraph).find("LINE").toArray();
    const lineEls = Array.from(paragEl.querySelectorAll('.BRlineElement'));

    let ySoFar = paragTop;
    for (const [ocrLine, lineEl] of zip(ocrLines, lineEls)) {
      // shift words using marginLeft to align with the correct x position
      const words = $(ocrLine).find("WORD").toArray();
      // const ocrLineLeft = Math.min(...words.map(w => parseFloat($(w).attr("coords").split(',')[0])));
      let xSoFar = paragLeft;
      for (const [ocrWord, wordEl] of zip(words, lineEl.querySelectorAll('.BRwordElement'))) {
        const wordRect = wordRects.get(wordEl);
        let diff = wordRect.left - xSoFar;
        // start of line, need to compute the offset relative to the OCR words
        const [ocrLeft, , , ] = $(ocrWord).attr("coords").split(',').map(parseFloat);
        diff = ocrLeft - xSoFar;
        xSoFar += diff;
        if (wordEl.previousElementSibling) {
          const space = wordEl.previousElementSibling;
          space.style.letterSpacing = `${diff - spaceRects.get(space).width}px`;
        } else {
          wordEl.style.marginLeft = `${diff}px`;
        }
        xSoFar += wordRect.width;
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

    paragEl.appendChild(document.createElement('br'));
    return paragEl;
  }
}

export class BookreaderWithTextSelection extends BookReader {
  init() {
    const options = Object.assign({}, DEFAULT_OPTIONS, this.options.plugins.textSelection);
    if (options.enabled) {
      this.textSelectionPlugin = new TextSelectionPlugin(options, this.options.vars);
      // Write this back; this way the plugin is the source of truth, and BR just
      // contains a reference to it.
      this.options.plugins.textSelection = options;
      this.textSelectionPlugin.init();

      new SelectionStartedObserver('.BRtextLayer', () => {
        // Track how often selection is used
        this.archiveAnalyticsSendEvent?.('BookReader', 'SelectStart');

        // Set a class on the page to avoid hiding it when zooming/etc
        this.refs.$br.find('.BRtextLayer--hasSelection').removeClass('BRpagecontainer--hasSelection');
        $(window.getSelection().anchorNode).closest('.BRpagecontainer').addClass('BRpagecontainer--hasSelection');
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
      this.textSelectionPlugin?.createTextLayer(pageContainer);
    }
    return pageContainer;
  }
}
window.BookReader = BookreaderWithTextSelection;
export default BookreaderWithTextSelection;


/**
 * @param {HTMLElement} parentEl
 * @param {string} selector
 * @returns {Map<Element, DOMRect>}
 */
function determineRealRects(parentEl, selector) {
  parentEl.style.position = 'absolute';
  parentEl.style.visibility = 'hidden';
  document.body.appendChild(parentEl);
  const rects = new Map(
    Array.from(parentEl.querySelectorAll(selector))
      .map(wordEl => [wordEl, wordEl.getBoundingClientRect()])
  );
  document.body.removeChild(parentEl);
  parentEl.style.position = '';
  parentEl.style.visibility = '';
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
