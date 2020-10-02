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
    let ignoreRest = false;
    this.manager.on('pinchmove', e => {
      if (ignoreRest || e.deltaTime < 100) return;
      this.br.zoom(e.scale > 1 ? 1 : -1);
      ignoreRest = true;
    });
    this.manager.on('pinchend', () => ignoreRest = false);
  }
}
