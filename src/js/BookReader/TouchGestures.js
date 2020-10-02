// @ts-check
/** @typedef {import("../BookReader.js").default} BookReader */
import Hammer from 'hammerjs';

export class TouchGestures {
  /**
    * @param {{ zoom: function(1|-1): void }} br
    */
  constructor(br) {
    this.br = br;

    /** Higher values cause quantized zooming to happen less frequently */
    this.ZOOM_FACTOR = 1.25;

    /** Only non-1 during a pinch gesture */
    this.activeScale = 1;
  }

  /**
   *
   * @param {HTMLElement} container
   */
  init(container) {
    this.manager = new Hammer.Manager(container, {
      touchAction: 'pan-x pan-y',
    });
    this.manager.add(new Hammer.Pinch());
    this.manager.on('pinchmove', e => this.quantizedZoom(e.scale));
    this.manager.on('pinchend', e => this.activeScale = 1);
  }

  /**
   * @param {Number} scale
   */
  quantizedZoom(scale) {
    if (scale > this.ZOOM_FACTOR * this.activeScale) {
      this.br.zoom(1);
      this.activeScale *= this.ZOOM_FACTOR;
    }
    if (scale < this.activeScale / this.ZOOM_FACTOR) {
      this.br.zoom(-1);
      this.activeScale /= this.ZOOM_FACTOR;
    }
  }
}
