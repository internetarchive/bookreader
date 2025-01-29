/** @typedef {import("./BookReader.js").default} BookReader */

export class BookReaderPlugin {
  /**
   * @param {BookReader} br
   */
  constructor(br) {
    /** @type {BookReader} */
    this.br = br;
  }

  /** @abstract */
  setup() {}

  /** @abstract */
  init() {}
}
