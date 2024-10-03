// @ts-check
import interact from 'interactjs';
import { isIOS, isSamsungInternet } from '../util/browserSniffing.js';
import { sleep } from './utils.js';
/** @typedef {import('./utils/HTMLDimensionsCacher.js').HTMLDimensionsCacher} HTMLDimensionsCacher */

/**
 * @typedef {object} SmoothZoomable
 * @property {HTMLElement} $container
 * @property {HTMLElement} $visibleWorld
 * @property {import("./options.js").AutoFitValues} autoFit
 * @property {number} scale
 * @property {HTMLDimensionsCacher} htmlDimensionsCacher
 * @property {function(): void} [attachScrollListeners]
 * @property {function(): void} [detachScrollListeners]
 */

/** Manages pinch-zoom, ctrl-wheel, and trackpad pinch smooth zooming. */
export class ModeSmoothZoom {
  /** Position (in unit-less, [0, 1] coordinates) in client to scale around */
  scaleCenter = { x: 0.5, y: 0.5 };

  /** @param {SmoothZoomable} mode */
  constructor(mode) {
    /** @type {SmoothZoomable} */
    this.mode = mode;

    /** Whether a pinch is currently happening */
    this.pinching = false;
    /** Non-null when a scale has been enqueued/is being processed by the buffer function */
    this.pinchMoveFrame = null;
    /** Promise for the current/enqueued pinch move frame. Resolves when it is complete. */
    this.pinchMoveFramePromise = Promise.resolve();
    this.oldScale = 1;
    /** @type {{ scale: number, clientX: number, clientY: number }}} */
    this.lastEvent = null;
    this.attached = false;

    /** @type {function(function(): void): any} */
    this.bufferFn = window.requestAnimationFrame.bind(window);
  }

  attach() {
    if (this.attached) return;

    this.attachCtrlZoom();

    // GestureEvents work only on Safari; they're too glitchy to use
    // fully, but they can sometimes help error correct when interact
    // misses an end/start event on Safari due to Safari bugs.
    this.mode.$container.addEventListener('gesturestart', this._pinchStart);
    this.mode.$container.addEventListener('gesturechange', this._preventEvent);
    this.mode.$container.addEventListener('gestureend', this._pinchEnd);

    if (isIOS()) {
      this.touchesMonitor = new TouchesMonitor(this.mode.$container);
      this.touchesMonitor.attach();
    }

    this.mode.$container.style.touchAction = "pan-x pan-y";

    // The pinch listeners
    this.interact = interact(this.mode.$container);
    this.interact.gesturable({
      listeners: {
        start: this._pinchStart,
        end: this._pinchEnd,
      },
    });
    if (isSamsungInternet()) {
      // Samsung internet pinch-zoom will not work unless we disable
      // all touch actions. So use interact.js' built-in drag support
      // to handle moving on that browser.
      this.mode.$container.style.touchAction = "none";
      this.interact
        .draggable({
          inertia: {
            resistance: 2,
            minSpeed: 100,
            allowResume: true,
          },
          listeners: { move: this._dragMove },
        });
    }


    this.attached = true;
  }

  detach() {
    this.detachCtrlZoom();

    // GestureEvents work only on Safari; they interfere with Hammer,
    // so block them.
    this.mode.$container.removeEventListener('gesturestart', this._pinchStart);
    this.mode.$container.removeEventListener('gesturechange', this._preventEvent);
    this.mode.$container.removeEventListener('gestureend', this._pinchEnd);

    this.touchesMonitor?.detach?.();

    // The pinch listeners
    this.interact.unset();
    interact.removeDocument(document);

    this.attached = false;
  }

  /** @param {Event} ev */
  _preventEvent = (ev) => {
    ev.preventDefault();
    return false;
  }

  _pinchStart = async () => {
    // Safari calls gesturestart twice!
    if (this.pinching) return;
    if (isIOS()) {
      // Safari sometimes causes a pinch to trigger when there's only one touch!
      await sleep(0); // touches monitor can receive the touch event late
      if (this.touchesMonitor.touches < 2) return;
    }
    this.pinching = true;

    // Do this in case the pinchend hasn't fired yet.
    this.oldScale = 1;
    this.mode.$visibleWorld.classList.add("BRsmooth-zooming");
    this.mode.$visibleWorld.style.willChange = "transform";
    this.mode.autoFit = "none";
    this.detachCtrlZoom();
    this.mode.detachScrollListeners?.();

    this.interact.gesturable({
      listeners: {
        start: this._pinchStart,
        move: this._pinchMove,
        end: this._pinchEnd,
      },
    });
  }

  /** @param {{ scale: number, clientX: number, clientY: number }}} e */
  _pinchMove = async (e) => {
    if (!this.pinching) return;
    this.lastEvent = {
      scale: e.scale,
      clientX: e.clientX,
      clientY: e.clientY,
    };
    if (!this.pinchMoveFrame) {
      // Buffer these events; only update the scale when request animation fires
      this.pinchMoveFrame = this.bufferFn(this._drawPinchZoomFrame);
    }
  }

  _pinchEnd = async () => {
    if (!this.pinching) return;
    this.pinching = false;
    this.interact.gesturable({
      listeners: {
        start: this._pinchStart,
        end: this._pinchEnd,
      },
    });
    // Want this to happen after the pinchMoveFrame,
    // if one is in progress; otherwise setting oldScale
    // messes up the transform.
    await this.pinchMoveFramePromise;
    this.scaleCenter = { x: 0.5, y: 0.5 };
    this.oldScale = 1;
    this.mode.$visibleWorld.classList.remove("BRsmooth-zooming");
    this.mode.$visibleWorld.style.willChange = "auto";
    this.attachCtrlZoom();
    this.mode.attachScrollListeners?.();
  }

  _drawPinchZoomFrame = async () => {
    // Because of the buffering/various timing locks,
    // this can be called after the pinch has ended, which
    // results in a janky zoom after the pinch.
    if (!this.pinching) {
      this.pinchMoveFrame = null;
      return;
    }

    this.mode.$container.style.overflow = "hidden";
    this.pinchMoveFramePromiseRes = null;
    this.pinchMoveFramePromise = new Promise(
      (res) => (this.pinchMoveFramePromiseRes = res),
    );
    this.updateScaleCenter({
      clientX: this.lastEvent.clientX,
      clientY: this.lastEvent.clientY,
    });
    const curScale = this.mode.scale;
    const newScale = curScale * this.lastEvent.scale / this.oldScale;

    if (curScale != newScale) {
      this.mode.scale = newScale;
      await this.pinchMoveFramePromise;
    }
    this.mode.$container.style.overflow = "auto";
    this.oldScale = this.lastEvent.scale;
    this.pinchMoveFrame = null;
  }

  _dragMove = async (e) => {
    if (this.pinching) {
      await this._pinchEnd();
    }
    this.mode.$container.scrollTop -= e.dy;
    this.mode.$container.scrollLeft -= e.dx;
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
    this.scaleCenter = {
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
    const XPOS = this.scaleCenter.x;
    const YPOS = this.scaleCenter.y;
    const oldCenter = {
      x: L + XPOS * W,
      y: T + YPOS * H,
    };
    const newCenter = {
      x: F * oldCenter.x,
      y: F * oldCenter.y,
    };

    container.scrollTop = newCenter.y - YPOS * H;
    container.scrollLeft = newCenter.x - XPOS * W;
    this.pinchMoveFramePromiseRes?.();
  }
}

export class TouchesMonitor {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    /** @type {HTMLElement} */
    this.container = container;
    this.touches = 0;
  }

  attach() {
    this.container.addEventListener("touchstart", this._updateTouchCount);
    this.container.addEventListener("touchend", this._updateTouchCount);
  }

  detach() {
    this.container.removeEventListener("touchstart", this._updateTouchCount);
    this.container.removeEventListener("touchend", this._updateTouchCount);
  }

  /**
   * @param {TouchEvent} ev
   */
  _updateTouchCount = (ev) => {
    this.touches = ev.touches.length;
  }
}
