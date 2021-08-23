// @ts-check
import Hammer from "hammerjs";

/**
 * @typedef {object} SmoothZoomable
 * @property {HTMLElement} $container
 * @property {HTMLElement} $visibleWorld
 * @property {number} scale
 * @property {function(): void} [attachScrollListeners]
 * @property {function(): void} [detachScrollListeners]
 * @property {function({ clientX: number, clientY: number}): void} updateScaleCenter
 */

export class ModeSmoothZoom {
  /** @param {SmoothZoomable} mode */
  constructor(mode) {
    /** @type {SmoothZoomable} */
    this.mode = mode;

    this.pinchMoveFrame = null;
    this.pinchMoveFramePromise = Promise.resolve();
    this.oldScale = 1;
    this.lastEvent = null;

    /** @type {HammerManager} */
    this.hammer = null;
  }

  attach() {
    this.attachCtrlZoom();

    // Hammer.js by default set userSelect to None; we don't want that!
    // TODO: Is there any way to do this not globally on Hammer?
    delete Hammer.defaults.cssProps.userSelect;
    this.hammer = new Hammer.Manager(this.mode.$container, {
      touchAction: "pan-x pan-y",
    });

    this.hammer.add(new Hammer.Pinch());
    this.hammer.on("pinchstart", () => {
      // Do this in case the pinchend hasn't fired yet.
      this.oldScale = 1;
      this.mode.$visibleWorld.style.willChange = "transform";
      this.detachCtrlZoom();
      this.mode.detachScrollListeners?.();
    });
    // This is SLOOOOW AF on iOS :/ Try buffering with requestAnimationFrame?
    this.hammer.on("pinchmove", (e) => {
      this.lastEvent = e;
      if (!this.pinchMoveFrame) {
        let pinchMoveFramePromiseRes = null;
        this.pinchMoveFramePromise = new Promise(
          (res) => (pinchMoveFramePromiseRes = res)
        );
        this.pinchMoveFrame = requestAnimationFrame(() => {
          this.mode.updateScaleCenter({
            clientX: this.lastEvent.center.x,
            clientY: this.lastEvent.center.y,
          });
          this.mode.scale *= this.lastEvent.scale / this.oldScale;
          this.oldScale = this.lastEvent.scale;
          this.pinchMoveFrame = null;
          pinchMoveFramePromiseRes();
        });
      }
    });

    const handlePinchEnd = async () => {
      // Want this to happen after the pinchMoveFrame,
      // if one is in progress; otherwise setting oldScale
      // messes up the transform.
      await this.pinchMoveFramePromise;
      this.scaleCenter = { x: 0.5, y: 0.5 };
      this.oldScale = 1;
      this.mode.$visibleWorld.style.willChange = "auto";
      this.attachCtrlZoom();
      this.mode.attachScrollListeners?.();
    };
    this.hammer.on("pinchend", handlePinchEnd);
    // iOS fires pinchcancel ~randomly; it looks like it sometimes
    // things the pinch becomes a pan, at which point it cancels?
    // More work needed here.
    this.hammer.on("pinchcancel", handlePinchEnd);
  }

  /** @private */
  attachCtrlZoom() {
    window.addEventListener("wheel", this.handleCtrlWheel, { passive: false });
  }

  /** @private */
  detachCtrlZoom() {
    window.removeEventListener("wheel", this.handleCtrlWheel);
  }

  /**
   * @private
   * @param {WheelEvent} ev
   **/
  handleCtrlWheel = (ev) => {
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
    this.mode.updateScaleCenter(ev);
    this.mode.scale *= 1 - Math.sign(ev.deltaY) * zoomMultiplier;
  }
}
