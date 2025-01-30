// @ts-check
/** @typedef {import("./BookReader.js").default} BookReader */

/**
 * @template TOptions
 */
export class BookReaderPlugin {
  /**
   * @param {BookReader} br
   */
  constructor(br) {
    /** @type {BookReader} */
    this.br = br;
    /** @type {TOptions} */
    this.options;
  }

  /**
   * @abstract
   * @param {TOptions} options
   **/
  setup(options) {
    this.options = Object.assign({}, this.options, options);
  }

  /** @abstract */
  init() {}
}
