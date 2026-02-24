// @ts-check
import { BookReaderPlugin } from '../BookReaderPlugin.js';

const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);

export class IiifPlugin extends BookReaderPlugin {
  options = {
    enabled: true,
    /** @type {import('@iiif/presentation-3').Manifest | import('@iiif/presentation-2').Manifest} */
    manifest: null,
  }

  setup(options) {
    super.setup(options);
    this.manifest = this.options.manifest;

    if (this.options.enabled) {
      Object.assign(this.br.options, this.load());
    }
  }

  load() {
    if (this.manifest["@context"] == "http://iiif.io/api/presentation/2/context.json") {
      const manifest = /** @type {import('@iiif/presentation-2').Manifest} */(this.manifest);
      return this.manifestToBookReaderV2(manifest);
    } else if (this.manifest["@context"] == "http://iiif.io/api/presentation/3/context.json") {
      const manifest = /** @type {import('@iiif/presentation-3').Manifest} */(this.manifest);
      return this.manifestToBookReaderV3(manifest);
    } else {
      throw new Error("Unsupported IIIF context " + this.manifest["@context"]);
    }
  }

  /**
   * @param {import('@iiif/presentation-3').Manifest} manifest
   */
  manifestToBookReaderV3(manifest) {
    /** @type {import('../BookReader/options.js').BookReaderOptions} */
    const book = {
      bookTitle: resolveInternationalString(manifest.label),
      pageProgression: manifest.viewingDirection == "right-to-left" ? "rl" : "lr",
      // numLeafs: manifest.items.length,
      metadata: (manifest.metadata || []).map((metadata) => {
        return {
          label: resolveInternationalString(metadata.label),
          value: resolveInternationalString(metadata.value),
        };
      }),
      data: [],
      /**
       * @this {import('../BookReader.js').default}
       */
      getPageURI(pageIndex, reduce, rotate) {
        const percent = Math.floor(100 * 1 / reduce);
        const bodyArr = manifest.items[pageIndex].items[0].items[0].body;
        const body = bodyArr instanceof Array ? bodyArr[0] : bodyArr;
        const uri = body.service[0].id;
        return `${uri}/full/pct:${percent}/0/default.jpg`;
      },
    };

    if (manifest.viewingDirection == "top-to-bottom" || manifest.viewingDirection == "bottom-to-top") {
      console.warn("Unsupported viewingDirection", manifest.viewingDirection);
    }

    let spread = [];
    manifest.items.forEach((item, index) => {
      const bodyArr = manifest.items[index].items[0].items[0].body;
      const body = bodyArr instanceof Array ? bodyArr[0] : bodyArr;
      const uri = body.service[0].id;
      /** @type {import('../BookReader/options.js').PageData} */
      const pageData = {
        uri,
        width: item.width,
        height: item.height,
        pageNum: resolveInternationalString(item.label),
      };
      spread.push(pageData);
      if (index % 2 == 0) {
        book.data.push(spread);
        spread = [];
      }
    });
    if (spread.length > 0) {
      book.data.push(spread);
    }
    return book;
  }

  /**
   * @param {import('@iiif/presentation-2').Manifest} manifest
   */
  manifestToBookReaderV2(manifest) {
    /** @type {import('../BookReader/options.js').BookReaderOptions} */
    const book = {
      bookTitle: manifest.label,
      metadata: manifest.metadata,
      thumbnail: manifest.thumbnail?.['@id'],
      // numLeafs: manifest.sequences[0].canvases.length,
      data: [],
      /**
       * @this {import('../BookReader.js').default}
       */
      getPageURI(pageIndex, reduce, rotate) {
        const percent = Math.floor(100 * 1 / reduce);
        const uri = manifest.sequences[0].canvases[pageIndex].images[0].resource.service['@id'];
        return `${uri}/full/pct:${percent}/0/default.jpg`;
      },
    };

    let spread = [];
    manifest.sequences[0].canvases.forEach((canvas, index) => {
      /** @type {import('../BookReader/options.js').PageData} */
      const pageData = {
        uri: canvas.images[0].resource.service['@id'],
        width: canvas.width,
        height: canvas.height,
        pageNum: canvas.label,
      };
      spread.push(pageData);
      if (index % 2 == 0) {
        book.data.push(spread);
        spread = [];
      }
    });
    if (spread.length > 0) {
      book.data.push(spread);
    }
    return book;
  }
}

/**
 * @param {import('@iiif/presentation-3').InternationalString} internationalString
 */
function resolveInternationalString(internationalString) {
  const anyLang = Object.keys(internationalString)[0];
  return (internationalString[navigator.language] || internationalString[anyLang])[0];
}

BookReader?.registerPlugin('iiif', IiifPlugin);
