// @ts-check
import Hammer from "hammerjs";
/** @typedef {import('./utils/HTMLDimensionsCacher.js').HTMLDimensionsCacher} HTMLDimensionsCacher */

/**
 * @typedef {object} SmoothZoomable
 * @property {HTMLElement} $container
 * @property {HTMLElement} $visibleWorld
 * @property {import("./options.js").AutoFitValues} autoFit
 * @property {number} scale
 * @property {{ x: number, y: number }} scaleCenter
 * @property {{ x: number, y: number }} worldOffset
 * @property {HTMLDimensionsCacher} htmlDimensionsCacher
 * @property {function(): void} [attachScrollListeners]
 * @property {function(): void} [detachScrollListeners]
 */

/** Manages pinch-zoom, ctrl-wheel, and trackpad pinch smooth zooming. */
export class ModeSmoothZoom {
  /** @param {SmoothZoomable} mode */
  constructor(mode) {
    /** @type {SmoothZoomable} */
    this.mode = mode;

    /** Non-null when a scale has been enqueued/is being processed by the buffer function */
    this.pinchMoveFrame = null;
    /** Promise for the current/enqueued pinch move frame. Resolves when it is complete. */
    this.pinchMoveFramePromise = Promise.resolve();
    this.oldScale = 1;
    /** @type {{ scale: number, center: { x: number, y: number }}} */
    this.lastEvent = null;
    this.attached = false;

    /** @type {function(function(): void): any} */
    this.bufferFn = window.requestAnimationFrame.bind(window);

    // Hammer.js by default set userSelect to None; we don't want that!
    // TODO: Is there any way to do this not globally on Hammer?
    delete Hammer.defaults.cssProps.userSelect;
    this.hammer = new Hammer.Manager(this.mode.$container, {
      touchAction: "pan-x pan-y",
    });

    this.hammer.add(new Hammer.Pinch());
  }

  attach() {
    if (this.attached) return;

    this.attachCtrlZoom();

    // GestureEvents work only on Safari; they interfere with Hammer,
    // so block them.
    this.mode.$container.addEventListener('gesturestart', this._preventEvent);
    this.mode.$container.addEventListener('gesturechange', this._preventEvent);
    this.mode.$container.addEventListener('gestureend', this._preventEvent);

    // The pinch listeners
    this.hammer.on("pinchstart", this._pinchStart);
    this.hammer.on("pinchmove", this._pinchMove);
    this.hammer.on("pinchend", this._pinchEnd);
    this.hammer.on("pinchcancel", this._pinchCancel);

    this.attached = true;
  }

  detach() {
    this.detachCtrlZoom();

    // GestureEvents work only on Safari; they interfere with Hammer,
    // so block them.
    this.mode.$container.removeEventListener('gesturestart', this._preventEvent);
    this.mode.$container.removeEventListener('gesturechange', this._preventEvent);
    this.mode.$container.removeEventListener('gestureend', this._preventEvent);

    // The pinch listeners
    this.hammer.off("pinchstart", this._pinchStart);
    this.hammer.off("pinchmove", this._pinchMove);
    this.hammer.off("pinchend", this._pinchEnd);
    this.hammer.off("pinchcancel", this._pinchCancel);

    this.attached = false;
  }

  /** @param {Event} ev */
  _preventEvent = (ev) => {
    ev.preventDefault();
    return false;
  }

  _pinchStart = () => {
    // Do this in case the pinchend hasn't fired yet.
    this.oldScale = 1;
    this.mode.$visibleWorld.classList.add("BRsmooth-zooming");
    this.mode.$visibleWorld.style.willChange = "transform";
    this.mode.autoFit = "none";
    this.detachCtrlZoom();
    this.mode.detachScrollListeners?.();
  }

  /** @param {{ scale: number, center: { x: number, y: number }}} e */
  _pinchMove = async (e) => {
    this.lastEvent = e;
    if (!this.pinchMoveFrame) {
      let pinchMoveFramePromiseRes = null;
      this.pinchMoveFramePromise = new Promise(
        (res) => (pinchMoveFramePromiseRes = res)
      );

      // Buffer these events; only update the scale when request animation fires
      this.pinchMoveFrame = this.bufferFn(() => {
        this.updateScaleCenter({
          clientX: this.lastEvent.center.x,
          clientY: this.lastEvent.center.y,
        });
        this.mode.scale *= this.lastEvent.scale / this.oldScale;
        this.oldScale = this.lastEvent.scale;
        this.pinchMoveFrame = null;
        pinchMoveFramePromiseRes();
      });
    }
  }

  _pinchEnd = async () => {
    // Want this to happen after the pinchMoveFrame,
    // if one is in progress; otherwise setting oldScale
    // messes up the transform.
    await this.pinchMoveFramePromise;
    this.mode.scaleCenter = { x: 0.5, y: 0.5 };
    this.oldScale = 1;
    this.mode.$visibleWorld.classList.remove("BRsmooth-zooming");
    this.mode.$visibleWorld.style.willChange = "auto";
    this.attachCtrlZoom();
    this.mode.attachScrollListeners?.();
  }

  _pinchCancel = async () => {
    // iOS fires pinchcancel ~randomly; it looks like it sometimes
    // thinks the pinch becomes a pan, at which point it cancels?
    await this._pinchEnd();
  }

  /** @private */
  attachCtrlZoom() {
    window.addEventListener("wheel", this._handleCtrlWheel, { passive: false });
  }

  /** @private */
  detachCtrlZoom() {
    window.removeEventListener("wheel", this._handleCtrlWheel);
  }

  /** @param {WheelEvent} ev **/
  _handleCtrlWheel = (ev) => {
    if (!ev.ctrlKey) return;
    ev.preventDefault();
    const zoomMultiplier =
        // Zooming on macs was painfully slow; likely due to their better
        // trackpads. Give them a higher zoom rate.
        /Mac/i.test(navigator.platform)
          ? 0.045
          : // This worked well for me on Windows
          0.03;

    // Zoom around the cursor
    this.updateScaleCenter(ev);
    this.mode.autoFit = "none";
    this.mode.scale *= 1 - Math.sign(ev.deltaY) * zoomMultiplier;
  }

  /**
   * @param {object} param0
   * @param {number} param0.clientX
   * @param {number} param0.clientY
   */
  updateScaleCenter({ clientX, clientY }) {
    const bc = this.mode.htmlDimensionsCacher.boundingClientRect;
    this.mode.scaleCenter = {
      x: (clientX - bc.left) / this.mode.htmlDimensionsCacher.clientWidth,
      y: (clientY - bc.top) / this.mode.htmlDimensionsCacher.clientHeight,
    };
  }

  /**
   * @param {number} newScale
   * @param {number} oldScale
   */
  updateViewportOnZoom(newScale, oldScale) {
    const container = this.mode.$container;
    const { scrollTop: T, scrollLeft: L } = container;
    const W = this.mode.htmlDimensionsCacher.clientWidth;
    const H = this.mode.htmlDimensionsCacher.clientHeight;

    // Scale factor change
    const F = newScale / oldScale;

    // Where in the viewport the zoom is centered on
    const XPOS = this.mode.scaleCenter.x;
    const YPOS = this.mode.scaleCenter.y;
    const oldCenter = {
      x: L + XPOS * W,
      y: T + YPOS * H,
    };
    const newCenter = {
      x: F * oldCenter.x,
      y: F * oldCenter.y,
    };

    container.scrollTop = newCenter.y - YPOS * H - this.mode.worldOffset.y;
    container.scrollLeft = newCenter.x - XPOS * W - this.mode.worldOffset.x;
  }
}
