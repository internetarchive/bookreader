/** @typedef {import("../BookReader.js").default} BookReader */
import Hammer from 'hammerjs';

export class TouchGestures {
  /**
    * @param {BookReader} br
    */
  constructor(br) {
    this.br = br;
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
    let lastScale = 1;
    this.manager.on('pinchmove', e => {
      if (e.scale > 1.25 * lastScale) {
        this.br.zoom(1);
        lastScale *= 1.25;
      }
      if (e.scale < lastScale / 1.25) {
        this.br.zoom(-1);
        lastScale /= 1.25;
      }
    });
    this.manager.on('pinchend', () => lastScale = 1);
  }
}
