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
    this.mode.$container.addEventListener('touchstart', this._touchStart, { passive: true });
    this.mode.$container.addEventListener('touchmove', this._touchMove, { passive: true });
    this.mode.$container.addEventListener('touchend', this._touchEnd, { passive: false });
    this.mode.$container.addEventListener('touchcancel', this._touchCancel);

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
    this.mode.$container.removeEventListener('touchstart', this._touchStart);
    this.mode.$container.removeEventListener('touchmove', this._touchMove);
    this.mode.$container.removeEventListener('touchend', this._touchEnd);
    this.mode.$container.removeEventListener('touchcancel', this._touchCancel);
    clearTimeout(this.tapTimer);
    this.lastTap = null;

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

  _paragraphAt(clientX, clientY) {
    for (const layer of this.mode.$container.querySelectorAll('.BRtextLayer')) {
      const rect = layer.getBoundingClientRect();
      const width = parseFloat(layer.style.width);
      const height = parseFloat(layer.style.height);
      if (!rect.width || !rect.height || !width || !height) continue;
      for (const paragraph of layer.querySelectorAll('.BRparagraphElement[data-ocr-coords]')) {
        const [left, bottom, right, top] = paragraph.dataset.ocrCoords.split(',').map(Number);
        if (![left, bottom, right, top].every(Number.isFinite) || right <= left || bottom <= top) continue;
        const bounds = {
          left: rect.left + left * rect.width / width,
          right: rect.left + right * rect.width / width,
          top: rect.top + top * rect.height / height,
          bottom: rect.top + bottom * rect.height / height,
        };
        if (clientX >= bounds.left && clientX <= bounds.right && clientY >= bounds.top && clientY <= bounds.bottom) {
          return { paragraph, layer, bounds };
        }
      }
    }
    return null;
  }

  _touchStart = (event) => {
    if (event.touches.length !== 1) {
      clearTimeout(this.tapTimer);
      this.lastTap = null;
      this.touch = null;
      return;
    }
    const { clientX, clientY } = event.touches[0];
    this.touch = { clientX, clientY, time: Date.now() };
  }

  _touchMove = (event) => {
    if (!this.touch || event.touches.length !== 1 ||
        Math.hypot(event.touches[0].clientX - this.touch.clientX, event.touches[0].clientY - this.touch.clientY) > 10) {
      clearTimeout(this.tapTimer);
      this.lastTap = null;
      this.touch = null;
    }
  }

  _touchCancel = () => {
    clearTimeout(this.tapTimer);
    this.lastTap = null;
    this.touch = null;
  }

  _touchEnd = (event) => {
    if (!this.touch || event.touches.length || Date.now() - this.touch.time > 350 || this.pinching) {
      this.touch = null;
      return;
    }
    const { clientX, clientY } = this.touch;
    this.touch = null;
    const hit = this._paragraphAt(clientX, clientY);
    if (!hit) return;

    const previous = this.lastTap;
    if (previous && previous.paragraph === hit.paragraph &&
        Date.now() - previous.time < 300 &&
        Math.hypot(clientX - previous.clientX, clientY - previous.clientY) < 30) {
      event.preventDefault();
      clearTimeout(this.tapTimer);
      this.lastTap = null;
      this._zoomToParagraph(hit);
      return;
    }

    if (previous?.navigate) {
      clearTimeout(this.tapTimer);
      previous.navigate();
      this.lastTap = null;
      return;
    }

    // Two-page mode turns pages on the compatibility mouseup. Delay only taps
    // over OCR paragraphs so a second tap can cancel the pending page turn.
    const page = hit.layer.closest('.BRpagecontainer');
    const isTwoPage = this.mode.$container.classList.contains('BRmode2up');
    if (isTwoPage && page && this.mode.br) {
      event.preventDefault();
      const side = page.dataset.side;
      const navigate = () => {
        if (side === 'L') this.mode.br.left();
        if (side === 'R') this.mode.br.right();
      };
      this.lastTap = { paragraph: hit.paragraph, clientX, clientY, time: Date.now(), navigate };
      this.tapTimer = setTimeout(() => {
        navigate();
        this.lastTap = null;
      }, 300);
    } else {
      this.lastTap = { paragraph: hit.paragraph, clientX, clientY, time: Date.now() };
    }
  }

  async _zoomToParagraph({ layer, paragraph, bounds }) {
    const container = this.mode.$container;
    const width = bounds.right - bounds.left;
    if (!width || !container.clientWidth) return;
    this.mode.autoFit = 'none';
    this.updateScaleCenter({ clientX: (bounds.left + bounds.right) / 2, clientY: bounds.top });
    this.mode.scale *= container.clientWidth / width;
    await this.mode.updateComplete;
    if (!paragraph.isConnected) return;
    const [left, , right, top] = paragraph.dataset.ocrCoords.split(',').map(Number);
    const layerRect = layer.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scaleX = layerRect.width / parseFloat(layer.style.width);
    const scaleY = layerRect.height / parseFloat(layer.style.height);
    container.scrollLeft += layerRect.left + (left + right) * scaleX / 2 - containerRect.left - container.clientWidth / 2;
    container.scrollTop += layerRect.top + top * scaleY - containerRect.top;
    this.scaleCenter = { x: 0.5, y: 0.5 };
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
