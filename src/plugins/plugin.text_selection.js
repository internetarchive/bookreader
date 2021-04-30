//@ts-check
import { createSVGPageLayer } from '../BookReader/PageContainer.js';
import { isFirefox, isSafari } from '../util/browserSniffing.js';
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

  constructor(options = DEFAULT_OPTIONS, optionVariables, avoidTspans = isFirefox(), pointerEventsOnParagraph = isSafari()) {
    this.options = options;
    this.optionVariables = optionVariables;
    /**@type {PromiseLike<JQuery<HTMLElement>|undefined>} */
    this.djvuPagesPromise = null;
    // Using text elements instead of tspans for words because Firefox does not allow svg tspan stretch.
    // Tspans are necessary on Chrome because they prevent newline character after every word when copying
    this.svgParagraphElement = "text";
    this.svgWordElement = "tspan";
    this.insertNewlines = avoidTspans;
    // Safari has a bug where `pointer-events` doesn't work on `<tspans>`. So
    // there we will set `pointer-events: all` on the paragraph element. We don't
    // do this everywhere, because it's a worse experience. Thanks Safari :/
    this.pointerEventsOnParagraph = pointerEventsOnParagraph;
    if (avoidTspans) {
      this.svgParagraphElement = "g";
      this.svgWordElement = "text";
    }

    /** @type {Cache<{index: number, response: any}>} */
    this.pageTextCache = new Cache();

    /**
     * Sometimes there are too many words on a page, and the browser becomes near
     * unusable. For now don't render text layer for pages with too many words.
     */
    this.maxWordRendered = 2500;

    this.entities = this.loadEntities();
  }

  init() {
    // Only fetch the full djvu xml if the single page url isn't there
    if (this.options.singlePageDjvuXmlUrl) return;
    this.djvuPagesPromise = $.ajax({
      type: "GET",
      url: applyVariables(this.options.fullDjvuXmlUrl, this.optionVariables),
      dataType: "html",
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

  async loadEntities() {
    const resp = await $.ajax({
      url: 'https://spreadsheets.google.com/feeds/cells/1SeAttSDh3SoXW9dZLi9OruWavV3m4GIVfEiwxGbvIKg/od6/public/values?alt=json-in-script',
      dataType: 'jsonp',
      cache: true,
    })
    const rows = resp.feed.entry.reduce((acc, cur) => {
      const isNewRow = cur.gs$cell.row != acc.length;
      if (isNewRow) {
        acc.push([]);
      }
      acc[acc.length - 1].push(cur.gs$cell.$t);
      return acc;
    }, []);
    return rows.slice(1)
      .map(([name, wikidata, type]) => ({
        re: new RegExp(`\\b${name}\\b`, 'ig'),
        type,
        wikidata,
      }));
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
        dataType: "html",
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
   * @param {SVGElement} svg
   */
  defaultMode(svg) {
    svg.classList.remove("selectingSVG");
    $(svg).on("mousedown.textSelectPluginHandler", (downEvent) => {
      if ($(downEvent.target).parents('a, rect.clickable').length) {
        downEvent.stopPropagation();
        $(svg).one("mouseup.textSelectPluginHandler", (upEvent) => {
          if (downEvent.target == upEvent.target) {
            upEvent.stopPropagation();
          }
        });
      }
      else if ($(downEvent.target).is(".BRwordElement")) {
        downEvent.stopPropagation();
        svg.classList.add("selectingSVG");

        $(svg).one("mouseup.textSelectPluginHandler", (upEvent) => {
          if (window.getSelection().toString() != "") {
            upEvent.stopPropagation();
            $(svg).off(".textSelectPluginHandler");
            this.textSelectingMode(svg);
          }
          else svg.classList.remove("selectingSVG");
        });
      }
    })
  }

  /**
   * Applies mouse events when in textSelecting mode
   * @param {SVGElement} svg
   */
  textSelectingMode(svg) {
    $(svg).on('mousedown.textSelectPluginHandler', (event) => {
      if (!$(event.target).is(".BRwordElement")) {
        if (window.getSelection().toString() != "") window.getSelection().removeAllRanges();
      }
      event.stopPropagation();
    });
    $(svg).on('mouseup.textSelectPluginHandler', (event) => {
      event.stopPropagation();
      if (window.getSelection().toString() == "") {
        $(svg).off(".textSelectPluginHandler");
        this.defaultMode(svg);      }
    });
  }

  /**
   * Initializes text selection modes if there is an svg on the page
   * @param {JQuery} $container
   */
  stopPageFlip($container) {
    /** @type {JQuery<SVGElement>} */
    const $svg = $container.find('svg.textSelectionSVG');
    if (!$svg.length) return;
    $svg.each((i, s) => this.defaultMode(s));
    this.interceptCopy($container);
  }

  getWordDimensions(word) {
    const [left, bottom, right, top] = $(word).attr("coords").split(',').map(parseFloat);
    return {left, bottom, right, top};
  }

  createWordElement(type, word) {
    const {left, bottom, right, top} = this.getWordDimensions(word);
    const el = document.createElementNS("http://www.w3.org/2000/svg", type);
    el.setAttribute("x", left.toString());
    el.setAttribute("y", bottom.toString());
    el.setAttribute("width", (right - left).toString());
    el.setAttribute("height", (bottom - top).toString());
    el.setAttribute("textLength", (right - left).toString());
    return el;
  }

  highlightRect(svg, word, e = null, meta = null) {
    const rect = this.createWordElement('rect', word);
    rect.setAttribute('rx', '8');
    rect.setAttribute('ry', '8');
    rect.classList.add("clickable");
    if (meta) {
      rect.setAttribute('title', meta.wikidata);
    }

    // .clickable listener
    rect.addEventListener("click", async ev => {
      console.log('hello world');
      const data = await fetch(
        `https://www.wikidata.org/wiki/Special:EntityData/${meta.wikidata}.json`
      ).then((res) => res.json());
      const popup = document.getElementById("jit-context");

      popup.style.display = "block";
      popup.innerHTML = '';
      const wpExtract = document.createElement('section');
      wpExtract.classList.add('wikipedia-extract');
      popup.append(wpExtract);

      // WP Image
      const imageClaim = data.entities[meta.wikidata].claims.P18;
      if (imageClaim) {
        const imageCommonsFilename = imageClaim[0].mainsnak.datavalue.value;
        // Need to use JSONP for this, so can't use fetch. The API doesn't support CORS.
        const commonsAPIResponse = await $.ajax({
          url: 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
            action: 'query',
            format: 'json',
            prop: 'imageinfo',
            iiprop: 'url',
            iilimit: '1',
            iiurlwidth: '400',
            titles: `File:${imageCommonsFilename}`,
          }),
          dataType: 'jsonp',
          cache: true,
        });
        const imageUrl = commonsAPIResponse.query.pages[Object.keys(commonsAPIResponse.query.pages)[0]].imageinfo[0].thumburl;
        wpExtract.innerHTML += `<img src="${imageUrl}">`;
      }

      const USER_LANG = 'en';
      const wpTitle = data.entities[meta.wikidata].sitelinks[`${USER_LANG}wiki`].title;

      // WP Link
      const wpLink = document.createElement('a');
      wpLink.href = `https://${USER_LANG}.wikipedia.org/wiki/${wpTitle}`;
      wpLink.textContent = 'View on Wikipedia »';
      wpLink.target = '_blank';
      wpExtract.append(wpLink);

      // WP Description
      const wpAPIResponse = await $.ajax({
        url: `https://${USER_LANG}.wikipedia.org/w/api.php?` + new URLSearchParams({
          format: 'json',
          action: 'query',
          prop: 'extracts',
          titles: wpTitle,
        }),
        dataType: 'jsonp',
        cache: true,
      });
      const htmlExtract = wpAPIResponse.query.pages[Object.keys(wpAPIResponse.query.pages)[0]].extract;
      const extractDiv = document.createElement('div');
      extractDiv.classList.add('extract');
      const html = new DOMParser().parseFromString(htmlExtract, 'text/html');
      extractDiv.appendChild(html.querySelector(`p:not(.mw-empty-elt)`));
      wpExtract.append(extractDiv);

      // OL More books by...
      const olidClaim = data.entities[meta.wikidata].claims.P648;
      if (olidClaim) {
        const olid = olidClaim[0].mainsnak.datavalue.value;
        const olMoreBooks = document.createElement('section');
        olMoreBooks.classList.add('openlibrary-more-books');
        const olLink = document.createElement('a');
        olLink.href = `https://openlibrary.org/b/${olid}`;
        olLink.textContent = 'View on Open Library »';
        olLink.target = '_blank';
        olMoreBooks.append(olLink);

        const olTypes = {'A': 'authors', 'W': 'works', 'M': 'editions'}
        const olType = olTypes[olid[olid.length-1]];
        const olHref = `https://openlibrary.org/${olType}/${olid}`;
        const header = document.createElement('h3');
        header.textContent = olType === 'authors' ? "Books by this author" :  "Browse these editions";
        olMoreBooks.append(header);

        const carousel = document.createElement('div');
        carousel.classList.add('ol-books-carousel');
        const olBooks = olType === 'works' ? `${olHref}/editions.json` : `${olHref}/works.json`;
        console.log(olBooks);  
        const olResponse = await fetch(olBooks).then(r => r.json());
        const bookEls = olResponse.entries.map(book => {
          const el = $(`<a href="https://openlibrary.org/${book.key}" target="_blank" />`)[0];
          const coverId = book.covers?.[0];
          if (coverId) {
            $(el).append(`<img src="https://covers.openlibrary.org/b/id/${coverId}-M.jpg">`);
          } else {
            const cover = $(`<div class="ol-fb-cover" />`)[0];
            cover.textContent = book.title;
            el.appendChild(cover);
          }
          el.title = book.title;
          return el;
        });
        $(carousel).append(bookEls);
        olMoreBooks.append(carousel);

        popup.append(olMoreBooks);
      }
    });

    // order of layers (to enable hover)
    const {top} = this.getWordDimensions(word);
    rect.setAttribute('y', top);
    e ? e.appendChild(rect) && svg.appendChild(e) : svg.appendChild(rect);
  }

  /**
   * @param {PageContainer} pageContainer
   */
  async createTextLayer(pageContainer) {
    const pageIndex = pageContainer.page.index;
    const $container = pageContainer.$container;
    const $svgLayers = $container.find('.textSelectionSVG');
    if ($svgLayers.length) return;
    const XMLpage = await this.getPageText(pageIndex);
    if (!XMLpage) return;

    const totalWords = $(XMLpage).find("WORD").length;
    if (totalWords > this.maxWordRendered) {
      console.log(`Page ${pageIndex} has too many words (${totalWords} > ${this.maxWordRendered}). Not rendering text layer.`);
      return;
    }

    const svg = createSVGPageLayer(pageContainer.page, 'textSelectionSVG');
    $container.append(svg);

    $(XMLpage).find("PARAGRAPH").each((i, paragraph) => {
      // Adding text element for each paragraph in the page
      const words = $(paragraph).find("WORD");
      if (!words.length) return;
      const paragSvg = document.createElementNS("http://www.w3.org/2000/svg", this.svgParagraphElement);
      paragSvg.setAttribute("class", "BRparagElement");
      if (this.pointerEventsOnParagraph) {
        paragSvg.style.pointerEvents = "all";
      }

      const wordHeightArr = [];

      for (let i = 0; i < words.length; i++) {
        // Adding tspan for each word in paragraph
        const currWord = words[i];
        // eslint-disable-next-line no-unused-vars
        const [left, bottom, right, top] = $(currWord).attr("coords").split(',').map(parseFloat);
        const wordHeight = bottom - top;
        wordHeightArr.push(wordHeight);

        const wordTspan = this.createWordElement(this.svgWordElement, currWord);
        wordTspan.setAttribute("class", "BRwordElement");
        wordTspan.setAttribute("lengthAdjust", "spacingAndGlyphs");
        wordTspan.textContent = currWord.textContent;
        paragSvg.appendChild(wordTspan);

        // Adding spaces after words except at the end of the paragraph
        // TODO: assumes left-to-right text
        if (i < words.length - 1) {
          const nextWord = words[i + 1];
          // eslint-disable-next-line no-unused-vars
          const [leftNext, bottomNext, rightNext, topNext] = $(nextWord).attr("coords").split(',').map(parseFloat);
          const spaceTspan = document.createElementNS("http://www.w3.org/2000/svg", this.svgWordElement);
          spaceTspan.setAttribute("class", "BRwordElement");
          spaceTspan.setAttribute("x", right.toString());
          spaceTspan.setAttribute("y", bottom.toString());
          if ((leftNext - right) > 0) spaceTspan.setAttribute("textLength", (leftNext - right).toString());
          spaceTspan.setAttribute("lengthAdjust", "spacingAndGlyphs");
          spaceTspan.textContent = " ";
          paragSvg.appendChild(spaceTspan);
        }

        // Adds newline at the end of paragraph on Firefox
        if ((i ==  words.length - 1 && (this.insertNewlines))) {
          paragSvg.appendChild(document.createTextNode("\n"));
        }
      }

      wordHeightArr.sort();
      const paragWordHeight = wordHeightArr[Math.floor(wordHeightArr.length * 0.85)];
      paragSvg.setAttribute("font-size", paragWordHeight.toString());
      svg.appendChild(paragSvg);
    });

    this.entities.then(entities => {

      function indexXml(node) {
        function main(node, index, str) {
          if (node.children.length == 0) {
            const word = str ? ' ' + node.textContent : node.textContent;
            const indexElement = { range: [str.length, str.length + word.length], node };
            index.push(indexElement);
            return str + word;
          } else {
            let aggStr = str;
            for (const el of node.children) {
              aggStr = main(el, index, aggStr);
            }
            return aggStr;
          }
        }
        const index = [];
        const str = main(node, index, '');
        return {index, str};
      }

      function findMatchingWords(str, index, re) {
        const matches = [];
        for (const match of str.matchAll(re)) {
          const start = match.index;
          const end = match.index + match[0].length;
          // start=10, end=27
          // {"range":[0,5],"node":{}},
          // {"range":[5,9],"node":{}},
          // {"range":[9,18],"node":{}},
          // {"range":[18,27],"node":{}}
          const nodes = [];
          let started = false;
          for (const {node, range} of index) {
            if (start >= range[0] && start <= range[1]) {
              started = true;
            }
            if (started) {
              nodes.push(node);
              if (end >= range[0] && end <= range[1]) {
                started = false;
              }
            }
          }
          matches.push(nodes);
        }
        return matches;
      }

      const {index, str} = indexXml(XMLpage);
      for (const entity of entities) {
        const matches = findMatchingWords(str, index, entity.re);
        if (matches.length) {
          for (const match of matches) {
            for (const node of match) {
              const a = this.createWordElement('a', node);
              this.highlightRect(svg, node, a, entity);
            }
          }
        }
      }
    });

    // Checks for entities
    for (const word of Array.from($(XMLpage).find("WORD"))) {
      const contents = word.textContent.trim()
        // Remove any trailing noise that sometimes appears
        .replace(/[.:;]+$/, '');
      // check for URLs
      if (/(^(http|www\.)|\.(com|org))/.test(contents) && contents != 'http') {
        const url = contents.startsWith('http') ? contents : `http://${contents}`;
        const a = this.createWordElement('a', word);
        a.setAttribute('href', url);
        a.setAttribute('target', '_blank');
        this.highlightRect(svg, word, a);
      }
    }
    this.stopPageFlip($container);
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
    }
    super.init();
    // cruft code for jit-popup
    const popup = document.createElement("div");
    popup.setAttribute("id", "jit-context");
    document.getElementById('BookReader').appendChild(popup);

    document.body.addEventListener('click', ev => {
      if (!$(ev.target).parents('#jit-context').length)
        popup.style.display = 'none';
    });
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
