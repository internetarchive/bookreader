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
