//@ts-check
import { createDIVPageLayer } from '../BookReader/PageContainer.js';
import { BookReaderPlugin } from '../BookReaderPlugin.js';
import { applyVariables } from '../util/strings.js';
import { Cache } from '../util/cache.js';
import { toISO6391 } from './tts/utils.js';
import { BookReaderTextFragment, renderHighlight, TextSelectionManager } from '../util/TextSelectionManager.js';
import { lookAroundWindow, zip } from '../util/generators.js';
import { parseOCRBook } from '../util/ocr/index.js';
import { Rect } from '../util/rect.js';
import textSelectionCss from '../css/_TextSelection.scss';
/** @typedef {import('../util/strings.js').StringWithVars} StringWithVars */
/** @typedef {import('../BookReader/PageContainer.js').PageContainer} PageContainer */
/** @typedef {import('../util/ocr/OCR.js').OCRPage} OCRPage */
/** @typedef {import('../util/ocr/OCR.js').OCRParagraph} OCRParagraph */

const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);


export class TextSelectionPlugin extends BookReaderPlugin {
  options = {
    enabled: true,
    /** @type {import('../util/ocr/index.js').OCRFormat} Format of the OCR the URLs below point at */
    format: 'DjVuXML',
    /** @type {StringWithVars} The URL to fetch the entire OCR file. Supports options.vars */
    fullDjvuXmlUrl: null,
    /** @type {StringWithVars} The URL to fetch a single page of the OCR file. Supports options.vars. Also has {{pageIndex}} */
    singlePageDjvuXmlUrl: null,
    /** Whether to fetch the XML as a jsonp */
    jsonp: false,
    /** Mox words that can be selected when the text layer is protected */
    maxProtectedWords: 200,
  }

  /**@type {PromiseLike<OCRPage[]|undefined>} */
  ocrPagesPromise = null;

  /** @type {Cache<{index: number, response: OCRPage}>} */
  pageTextCache = new Cache();

  /**
   * Sometimes there are too many words on a page, and the browser becomes near
   * unusable. For now don't render text layer for pages with too many words.
   */
  maxWordRendered = 2500;

  _jumpedToHighlight = false;

  /**
   * Isolated document/layout used to performantly measure OCR text-layer
   * elements.
   * @type {Document}
   */
  _measurementDocument;

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
    this.textSelectionManager = new TextSelectionManager('.BRtextLayer', this.br, {selectionElement: ['.BRwordElement', '.BRspace', 'mark']}, this.options.maxProtectedWords);
  }

  /** @override */
  init() {
    if (!this.options.enabled) return;

    // Setup measurement iframe for OCR
    const measurementIframe = document.createElement('iframe');
    measurementIframe.setAttribute('aria-hidden', 'true');
    measurementIframe.tabIndex = -1;
    measurementIframe.style.cssText = 'position:fixed; top:-99999px; left:-99999px; width:2000px; height:4000px; border:0; visibility:hidden;';
    document.body.appendChild(measurementIframe);
    this._measurementDocument = measurementIframe.contentDocument;
    // Injects _TextSelection.scss so measurements match the real
    // rendering
    const style = this._measurementDocument.createElement('style');
    style.textContent = textSelectionCss;
    this._measurementDocument.head.appendChild(style);

    this.br.on('pageVisible', (_, {pageContainerEl}) => {
      const textLayer = pageContainerEl.querySelector('.BRtextLayer');
      if (textLayer) {
        this.br.trigger('textLayerVisible', {pageContainerEl, textLayer});
      }
    });

    this.loadData();
    this.textSelectionManager.init();

    // Init text fragment
    const textParam = new URLSearchParams(location.search).get('text');
    if (textParam) {
      this.targetTextFragment = BookReaderTextFragment.fromString(textParam, this.br.book, this.br.firstIndex);
      const targetTextFragment = this.targetTextFragment;
      this.br.on('textLayerVisible', async (_, {pageContainerEl, textLayer}) => {
        const pageIndex = targetTextFragment.pageIndex;
        const hasTargetText = pageIndex === parseFloat(pageContainerEl.getAttribute('data-index'));
        if (hasTargetText) {
          const markEls = renderHighlight(textLayer, targetTextFragment, 'BRhighlight--target-text');
          // Only jump once; presumably on first page load.
          if (!this._jumpedToHighlight) {
            this.br.scrollIntoView(markEls[0], {behavior: 'smooth', block: 'center'});
            this._jumpedToHighlight = true;
          }
        }
      });
    }
  }

  /**
   * @override
   * @param {PageContainer} pageContainer
   * @returns {PageContainer}
   */
  _configurePageContainer(pageContainer) {
    // Disable if thumb mode; it's too janky
    // .page can be null for "pre-cover" region
    if (this.options.enabled && this.br.mode !== this.br.constModeThumb && pageContainer.page?.isViewable) {
      this.createTextLayer(pageContainer);
    }
    return pageContainer;
  }

  loadData() {
    // Only fetch the full OCR file if the single page url isn't there
    if (this.options.singlePageDjvuXmlUrl) return;
    this.ocrPagesPromise = $.ajax({
      type: "GET",
      url: applyVariables(this.options.fullDjvuXmlUrl, this.br.options.vars),
      dataType: this.options.jsonp ? "jsonp" : "html",
      cache: true,
      xhrFields: {
        withCredentials: this.br.protected,
      },
      error: (e) => undefined,
    }).then((res) => {
      try {
        return parseOCRBook(this.options.format, res).pages;
      } catch (e) {
        return undefined;
      }
    });
  }

  /**
   * @param {number} index
   * @returns {Promise<OCRPage|undefined>}
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
          withCredentials: this.br.protected,
        },
        error: (e) => undefined,
      });
      try {
        const result = parseOCRBook(this.options.format, res).pages[0];
        this.pageTextCache.add({ index, response: result });
        return result;
      } catch (e) {
        return undefined;
      }
    } else {
      const ocrPages = await this.ocrPagesPromise;
      if (ocrPages) return ocrPages[index];
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
    const ocrPage = await this.getPageText(pageIndex);
    if (!ocrPage) return;

    const totalWords = ocrPage.words.length;
    if (totalWords > this.maxWordRendered) {
      console.log(`Page ${pageIndex} has too many words (${totalWords} > ${this.maxWordRendered}). Not rendering text layer.`);
      return;
    }

    const textLayer = createDIVPageLayer(pageContainer.page, 'BRtextLayer');
    // Have to wait to make sure the page container is actually rendered,
    // otherwise width/height are unset after a mode change.
    await Promise.resolve();
    const ratioW = parseFloat(pageContainer.$container[0].style.width) / pageContainer.page.width;
    const ratioH = parseFloat(pageContainer.$container[0].style.height) / pageContainer.page.height;
    textLayer.style.transform = `scale(${ratioW}, ${ratioH})`;
    const bookLangCode = toISO6391(this.br.options.bookLanguage);
    if (bookLangCode) {
      textLayer.setAttribute("lang", bookLangCode);
    }
    textLayer.setAttribute("dir", this.rtl ? "rtl" : "ltr");

    const ocrParagraphs = ocrPage.paragraphs;
    const paragEls = ocrParagraphs.map(p => {
      const el = this.renderParagraph(p);
      textLayer.appendChild(el);
      return el;
    });

    // Fix up paragraph positions
    const paragraphRects = determineRealRects(textLayer, '.BRparagraphElement', this._measurementDocument);
    let yAdded = 0;
    for (const [ocrParagraph, paragEl] of zip(ocrParagraphs, paragEls)) {
      const realRect = paragraphRects.get(paragEl);
      const { left: ocrLeft, right: ocrRight, top: ocrTop } = ocrParagraph.box;
      const newStartMargin = this.rtl ? (realRect.right - ocrRight) : (ocrLeft - realRect.left);
      const newTop = ocrTop - (realRect.top + yAdded);

      paragEl.style[this.rtl ? 'marginRight' : 'marginLeft'] = `${newStartMargin}px`;
      paragEl.style.marginTop = `${newTop}px`;
      yAdded += newTop;
      textLayer.appendChild(paragEl);
      textLayer.appendChild(document.createTextNode('\n'));
    }
    $container.append(textLayer);
    this.textSelectionManager.stopPageFlip($container);
    this.br.trigger('textLayerRendered', {
      pageIndex,
      pageContainer,
    });

    // Check if page is visible
    if ($container.hasClass('BRpage-visible')) {
      this.br.trigger('textLayerVisible', {pageContainerEl: $container[0], textLayer});
    }
  }

  /**
   * @param {OCRParagraph} ocrParagraph
   * @returns {HTMLParagraphElement}
   */
  renderParagraph(ocrParagraph) {
    const paragEl = document.createElement('p');
    paragEl.classList.add('BRparagraphElement');
    if (ocrParagraph.isHeaderFooter) {
      paragEl.classList.add('ocr-role-header-footer');
      paragEl.ariaHidden = "true";
    }
    const { left: paragLeft, bottom: paragBottom, right: paragRight, top: paragTop } = ocrParagraph.box;
    const wordHeightArr = [];
    const lines = ocrParagraph.lines;
    if (!lines.length) return paragEl;

    for (const [prevLine, line, nextLine] of lookAroundWindow(lines)) {
      const isLastLineOfParagraph = line == lines[lines.length - 1];
      const lineEl = document.createElement('span');
      lineEl.classList.add('BRlineElement');

      for (const [wordIndex, currWord] of line.words.entries()) {
        const { bottom, right, top } = currWord.box;
        const wordHeight = bottom - top;
        wordHeightArr.push(wordHeight);

        if (wordIndex == 0 && prevLine?.lastWord.text.trim().endsWith('-')) {
          // ideally prefer the next line to determine the left position,
          // since the previous line could be the first line of the paragraph
          // and hence have an incorrectly indented first word.
          // E.g. https://archive.org/details/driitaleofdaring00bachuoft/page/360/mode/2up
          const newLeft = (nextLine || prevLine).firstWord.box.left;
          currWord.box = Rect.fromEdges(newLeft, top, right, bottom);
        }

        const wordEl = document.createElement('span');
        wordEl.setAttribute("class", "BRwordElement");
        wordEl.textContent = currWord.text.trim();

        if (wordIndex > 0) {
          const space = document.createElement('span');
          space.classList.add('BRspace');
          space.textContent = ' ';
          // Hack to make screen readers (eg NVDA) read spaces correctly;
          // otherwise they ignore elements with just whitespace.
          space.setAttribute('aria-label', '\u00A0');
          lineEl.append(space);

          // Edge ignores empty elements (like BRspace), so add another
          // space to ensure Edge's ReadAloud works correctly.
          lineEl.appendChild(document.createTextNode(' '));
        }

        lineEl.appendChild(wordEl);
      }

      const hasHyphen = line.lastWord.text.trim().endsWith('-');
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
    let wordRects = determineRealRects(paragEl, '.BRwordElement', this._measurementDocument);
    const ocrWords = ocrParagraph.words;
    const wordEls = paragEl.querySelectorAll('.BRwordElement');
    for (const [ocrWord, wordEl] of zip(ocrWords, wordEls)) {
      const realRect = wordRects.get(wordEl);
      let ocrWidth = ocrWord.box.width;
      // Some books (eg theworksofplato01platiala) have a space _inside_ the <WORD>
      // element. That makes it impossible to determine the correct positining
      // of everything, but to avoid the BRspace's being width 0, which makes selection
      // janky on Chrome Android, assume the space is the same width as one of the
      // letters.
      if (ocrWord.text.endsWith(' ')) {
        ocrWidth = ocrWidth * (ocrWord.text.length - 1) / ocrWord.text.length;
      }
      const diff = ocrWidth - realRect.width;
      wordEl.style.letterSpacing = `${diff / (ocrWord.text.length - 1)}px`;
    }

    // Stretch/crush lines as necessary using line spacing
    // Recompute rects after letter spacing
    wordRects = determineRealRects(paragEl, '.BRwordElement', this._measurementDocument);
    const spaceRects = determineRealRects(paragEl, '.BRspace', this._measurementDocument);

    const ocrLines = ocrParagraph.lines;
    const lineEls = Array.from(paragEl.querySelectorAll('.BRlineElement'));

    let ySoFar = paragTop;
    for (const [ocrLine, lineEl] of zip(ocrLines, lineEls)) {
      // shift words using marginLeft to align with the correct x position
      const words = ocrLine.words;
      let xSoFar = this.rtl ? paragRight : paragLeft;
      for (const [ocrWord, wordEl] of zip(words, lineEl.querySelectorAll('.BRwordElement'))) {
        // start of line, need to compute the offset relative to the OCR words
        const wordRect = wordRects.get(wordEl);
        const { left: ocrLeft, right: ocrRight } = ocrWord.box;
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
      const ocrLineTop = Math.min(...words.map(w => w.box.top));
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
 * @param {Document} measurementDocument Isolated document to measure within
 *   (see TextSelectionPlugin#_measurementDocument for why).
 * @returns {Map<Element, Rect>}
 */
function determineRealRects(parentEl, selector, measurementDocument) {
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
  measurementDocument.body.appendChild(parentEl);
  const rects = new Map(
    Array.from(parentEl.querySelectorAll(selector))
      .map(wordEl => {
        const origRect = wordEl.getBoundingClientRect();
        return [wordEl, new Rect(
          origRect.left + measurementDocument.defaultView.scrollX,
          origRect.top + measurementDocument.defaultView.scrollY,
          origRect.width,
          origRect.height,
        )];
      }),
  );
  measurementDocument.body.removeChild(parentEl);
  Object.assign(parentEl.style, initals);
  // Need to restore the document to the main window document
  document.adoptNode(parentEl);
  return rects;
}
