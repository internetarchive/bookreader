import { calcScreenDPI } from './utils';

/**
 * There are a few different "coordinate spaces" at play in BR:
 * (1) World units: i.e. inches. Unless otherwise stated, all computations
 *     are done in world units.
 * (2) Rendered Pixels: i.e. img.width = '300'. Note this does _not_ take
 *     into account zoom scaling.
 * (3) Visible Pixels: Just rendered pixels, but taking into account scaling.
 */
export class ModeCoordinateSpace {
  screenDPI = calcScreenDPI();

  /**
   * @param {{ scale: number }} mode
   */
  constructor(mode) {
    this.mode = mode;
  }

  worldUnitsToRenderedPixels = (/** @type {number} */inches) => inches * this.screenDPI;
  renderedPixelsToWorldUnits = (/** @type {number} */px) => px / this.screenDPI;

  renderedPixelsToVisiblePixels = (/** @type {number} */px) => px * this.mode.scale;
  visiblePixelsToRenderedPixels = (/** @type {number} */px) => px / this.mode.scale;

  worldUnitsToVisiblePixels = (/** @type {number} */px) => this.renderedPixelsToVisiblePixels(this.worldUnitsToRenderedPixels(px));
  visiblePixelsToWorldUnits = (/** @type {number} */px) => this.renderedPixelsToWorldUnits(this.visiblePixelsToRenderedPixels(px));
}
