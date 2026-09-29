// @ts-check

/**
 * Basically a polyfill for the native DOMRect class
 */
export class Rect {
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

  /**
   * @param {number} left
   * @param {number} top
   * @param {number} right
   * @param {number} bottom
   * @returns {Rect}
   */
  static fromEdges(left, top, right, bottom) {
    return new Rect(left, top, right - left, bottom - top);
  }

  /**
   * The smallest rect containing all of `rects`, or null if there are none.
   * @param {Rect[]} rects
   * @returns {Rect | null}
   */
  static bounding(rects) {
    if (!rects.length) return null;
    return Rect.fromEdges(
      Math.min(...rects.map(r => r.left)),
      Math.min(...rects.map(r => r.top)),
      Math.max(...rects.map(r => r.right)),
      Math.max(...rects.map(r => r.bottom)),
    );
  }
}
