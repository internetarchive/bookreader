import { applyVariables } from "../../util/strings.js";

/**
 * Class to manage a 'chunk' (approximately a paragraph) of text on a page.
 */
export default class PageChunk {
  /**
   * @param {number} leafIndex
   * @param {number} chunkIndex
   * @param {string} text
   * @param {DJVURect[]} lineRects
   */
  constructor(leafIndex, chunkIndex, text, lineRects) {
    this.leafIndex = leafIndex;
    this.chunkIndex = chunkIndex;
    this.text = text;
    this.lineRects = lineRects;
  }

  /**
   * @param {import('@/src/util/strings.js').StringWithVars} pageChunkUrl
   * @param {number} leafIndex
   * @return {Promise<PageChunk[]>}
   */
  static async fetch(pageChunkUrl, leafIndex) {
    console.log('PageChunk.fetch', leafIndex);
    if (br.plugins.translate?.translationManager.active) {
      const pageChunks = [];

      let textLayer = document.querySelector(`[data-index='${leafIndex}']`);
      // console.log("this is textLayer", textLayer, leafIndex);
      // if (textLayer && !textLayer.textContent) {
      //   console.log("no textContent here will return a placeholderChunk", leafIndex);
      //   const placeholderChunk = new PageChunk(leafIndex, 0, "", []);
      //   return [placeholderChunk, placeholderChunk];
      // }
      const translateLayer = await br.plugins.translate.getTranslateLayer(leafIndex);
      // Check if the translateLayer has no textContent, might not need to do anything
      if (!translateLayer) {
        console.log("inserting placeholder chunk here");
        const placeholderChunk = new PageChunk(leafIndex, 0, "", []);
        pageChunks.push(placeholderChunk);
        return pageChunks;
      }
      // console.log("should have finished waiting for translateLayer", leafIndex, translateLayer);
      let paragraphs = Array.from(translateLayer.childNodes);
      for (const [idx, item] of paragraphs.entries()) {
        const translatedChunk = new PageChunk(leafIndex, idx, item.textContent, []);
        pageChunks.push(translatedChunk);
      }
      if (!pageChunks.length) {
        console.log("creating a placeholder PageChunk here", translateLayer);
        return [];
      }
      // console.log("will return pageChunks now", pageChunks);
      return pageChunks
    // if (br.plugins.translate?.active) {
    //   const translateLayer = (something).querySelector(something);

    // } else if (br.plugins.textSelection) {
    //   // DO SOMETHING
    //   // Get the text layer of this leaf index
    //   const textLayer = (something).querySelector(something);

    //   // split the DOM textLayer up into paragraphs
    //     // find the bounding boxes of the lines, and output a format identical to
    //     // https://ia800501.us.archive.org/BookReader/BookReaderGetTextWrapper.php?path=%2F17%2Fitems%2Ftheworksofplato01platiala%2Ftheworksofplato01platiala_djvu.xml&page=68&callback=false
    } else {
      const chunks = await $.ajax({
        type: 'GET',
        url: applyVariables(pageChunkUrl, { pageIndex: leafIndex }),
        cache: true,
        xhrFields: {
          withCredentials: window.br.protected,
        },
      });
      return PageChunk._fromTextWrapperResponse(leafIndex, chunks);
    }
  }

  /**
   * Convert the response from BookReaderGetTextWrapper.php into a {@link PageChunk} instance
   * @param {number} leafIndex
   * @param {Array<[String, ...DJVURect[]]>} chunksResponse
   * @return {PageChunk[]}
   */
  static _fromTextWrapperResponse(leafIndex, chunksResponse) {
    return chunksResponse.map((c, i) => {
      const correctedLineRects = PageChunk._fixChunkRects(c.slice(1));
      const correctedText = PageChunk._removeDanglingHyphens(c[0]);
      return new PageChunk(leafIndex, i, correctedText, correctedLineRects);
    });
  }

  /**
   * @private
   * Sometimes the first rectangle will be ridiculously wide/tall. Find those and fix them
   * *NOTE*: Modifies the original array and returns it.
   * *NOTE*: This should probably be fixed on the petabox side, and then removed here
   * Has 2 problems:
   *  - If the rect is the last rect on the page (and hence the only rect in the array),
   *    the rect's size isn't fixed
   * - Because this relies on the second rect, there's a chance it won't be the right
   *   width
   * @param {DJVURect[]} rects
   * @return {DJVURect[]}
   */
  static _fixChunkRects(rects) {
    if (rects.length < 2) return rects;

    const [firstRect, secondRect] = rects;
    const [left, bottom, right] = firstRect;
    const width = right - left;
    const secondHeight = secondRect[1] - secondRect[3];
    const secondWidth = secondRect[2] - secondRect[0];
    const secondRight = secondRect[2];

    if (width > secondWidth * 30) {
      // Set the end to be the same
      firstRect[2] = secondRight;
      // And the top to be the same height
      firstRect[3] = bottom - secondHeight;
    }

    return rects;
  }

  /**
   * Remove "dangling" hyphens from read aloud text to avoid TTS stuttering
   * @param {string} text
   * @return {string}
   */
  static _removeDanglingHyphens(text) {
    // Some books mis-OCR a dangling hyphen as a ¬ (mathematical not sign) . Since in math
    // the not sign should not appear followed by a space, we think we can safely assume
    // this should be replaced.
    return text.replace(/[-¬]\s+/g, '');
  }
}

/**
 * @typedef {[number, number, number, number]} DJVURect
 * coords are in l,b,r,t order
 */
