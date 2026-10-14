import sinon from 'sinon';
import interact from 'interactjs';
import { EventTargetSpy, afterEventLoop } from '../utils.js';
import * as browserSniffing from '@/src/util/browserSniffing.js';
import { ModeSmoothZoom, TouchesMonitor } from '@/src/BookReader/ModeSmoothZoom.js';
/** @typedef {import('@/src/BookReader/ModeSmoothZoom.js').SmoothZoomable} SmoothZoomable */

/**
 * @param {Partial<SmoothZoomable>} overrides
 * @returns {SmoothZoomable}
 */
function dummy_mode(overrides = {}) {
  return {
    $container: document.createElement('div'),
    $visibleWorld: document.createElement('div'),
    scale: 1,
    htmlDimensionsCacher: {
      clientWidth: 100,
      clientHeight: 100,
      boundingClientRect: { left: 0, top: 0 },
    },
    scaleCenter: {x: 0.5, y: 0.5},
    ...overrides,
  };
}

afterEach(() => {
  sinon.restore();
  try {
    interact.removeDocument(document);
  } catch (e) {}
});

describe('ModeSmoothZoom', () => {
  test('handle iOS-only gesture events', () => {
    const mode = dummy_mode();
    const msz = new ModeSmoothZoom(mode);
    sinon.stub(msz, '_pinchStart');
    sinon.stub(msz, '_pinchMove');
    sinon.stub(msz, '_pinchEnd');

    msz.attach();

    const gesturestart = new Event('gesturestart', {});
    mode.$container.dispatchEvent(gesturestart);
    expect(msz._pinchStart.callCount).toBe(1);
  });

  test('sets will-change', async () => {
    const mode = dummy_mode();
    const msz = new ModeSmoothZoom(mode);
    msz.attach();
    expect(mode.$visibleWorld.style.willChange).toBeFalsy();
    msz._pinchStart();
    expect(mode.$visibleWorld.style.willChange).toBe('transform');
    await msz._pinchEnd();
    expect(mode.$visibleWorld.style.willChange).toBe('auto');
  });

  test('pinch move updates scale', () => {
    const mode = dummy_mode();
    const msz = new ModeSmoothZoom(mode);
    msz.attach();
    // disable buffering
    msz.bufferFn = (callback) => callback();
    msz._pinchStart();
    expect(mode.scale).toBe(1);
    msz._pinchMove({ scale: 2, center: { x: 0, y: 0 }});
    expect(mode.scale).toBe(2);
  });

  test('updateScaleCenter sets scaleCenter in unitless coordinates', () => {
    const mode = dummy_mode({
      htmlDimensionsCacher: {
        clientWidth: 200,
        clientHeight: 100,
        boundingClientRect: {
          left: 5,
          top: 50,
        },
      },
    });
    const msz = new ModeSmoothZoom(mode);
    expect(msz.scaleCenter).toEqual({ x: 0.5, y: 0.5 });
    msz.updateScaleCenter({ clientX: 85, clientY: 110 });
    expect(msz.scaleCenter).toEqual({ x: 0.4, y: 0.6 });
  });

  test('detaches all listeners', async () => {
    const mode = dummy_mode();
    const msz = new ModeSmoothZoom(mode);

    const documentEventSpy = EventTargetSpy.wrap(document);
    const containerEventSpy = EventTargetSpy.wrap(mode.$container);
    const visibleWorldSpy = EventTargetSpy.wrap(mode.$visibleWorld);

    msz.attach();
    await afterEventLoop();
    expect(documentEventSpy._totalListenerCount).toBeGreaterThan(0);
    expect(containerEventSpy._totalListenerCount).toBeGreaterThan(0);

    msz.detach();
    expect(documentEventSpy._totalListenerCount).toBe(0);
    expect(containerEventSpy._totalListenerCount).toBe(0);
    expect(visibleWorldSpy._totalListenerCount).toBe(0);
  });

  test('attach can be called twice without double attachments', () => {
    const mode = dummy_mode();
    const msz = new ModeSmoothZoom(mode);

    const documentEventSpy = EventTargetSpy.wrap(document);
    const containerEventSpy = EventTargetSpy.wrap(mode.$container);
    const visibleWorldSpy = EventTargetSpy.wrap(mode.$visibleWorld);

    msz.attach();
    const documentListenersCount = documentEventSpy._totalListenerCount;
    const containerListenersCount = containerEventSpy._totalListenerCount;
    const visibleWorldListenersCount = visibleWorldSpy._totalListenerCount;

    msz.attach();
    expect(documentEventSpy._totalListenerCount).toBe(documentListenersCount);
    expect(containerEventSpy._totalListenerCount).toBe(containerListenersCount);
    expect(visibleWorldSpy._totalListenerCount).toBe(visibleWorldListenersCount);
  });

  describe('_handleCtrlWheel', () => {
    test('non-ctrl wheel events ignored', () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      expect(mode.scale).toBe(1);
      const ev = new WheelEvent('wheel', { ctrlKey: false, deltaY: 20 });
      const preventDefaultSpy = sinon.spy(ev, 'preventDefault');
      msz._handleCtrlWheel(ev);
      expect(preventDefaultSpy.callCount).toBe(0);
      expect(mode.scale).toBe(1);
    });

    test('ctrl-wheel events update scale', () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      expect(mode.scale).toBe(1);
      const ev = new WheelEvent('wheel', { ctrlKey: true, deltaY: 20 });
      const preventDefaultSpy = sinon.spy(ev, 'preventDefault');
      msz._handleCtrlWheel(ev);
      expect(preventDefaultSpy.callCount).toBe(1);
      expect(mode.scale).not.toBe(1);
    });
  });

  describe("double-tap-and-drag zoom", () => {
    /** @param {Partial<{clientX: number, clientY: number, timeStamp: number, pointerType: string, touches: any[]}>} overrides */
    function touchEvent({ clientX = 0, clientY = 0, timeStamp = 0, pointerType = 'touch', touches = [{}] } = {}) {
      return {
        clientX,
        clientY,
        timeStamp,
        pointerType,
        originalEvent: { touches, preventDefault: sinon.spy() },
        preventDefault: sinon.spy(),
      };
    }

    test('drag down after a double-tap zooms in (matches Google Maps/Chrome)', async () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.attach();
      msz.bufferFn = (cb) => cb();

      // First tap
      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      await msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
      // Second tap, close in time/space -> double-tap candidate
      msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));
      expect(mode.scale).toBe(1);
      // Drag down (increasing clientY) engages the zoom and increases scale
      msz._handleTapMove(touchEvent({ clientX: 52, clientY: 90, timeStamp: 120 }));
      expect(mode.scale).toBeGreaterThan(1);
      // Reused from pinch-zoom: settles the in-flight frame, same as the
      // real mode component's updated() lifecycle hook would.
      msz.pinchMoveFramePromiseRes();

      await msz._handleTapUp(touchEvent({ clientX: 52, clientY: 90, timeStamp: 140 }));
      expect(mode.$visibleWorld.classList.contains('BRsmooth-zooming')).toBe(false);
    });

    test('consecutive move events keep zooming, rather than each one cancelling the last', async () => {
      // Regression test: engaging the drag reuses pinch-zoom's own `pinching`
      // flag (per code review), which must not make the *second* move event
      // mistake the drag it itself started for an external pinch pre-empting it.
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.attach();
      msz.bufferFn = (cb) => cb();

      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
      msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));

      msz._handleTapMove(touchEvent({ clientX: 52, clientY: 70, timeStamp: 120 }));
      const scaleAfterFirstMove = mode.scale;
      expect(mode.$visibleWorld.classList.contains('BRsmooth-zooming')).toBe(true);
      // Settle the in-flight frame (as the real component's updated() hook
      // would) so the next move's frame isn't just buffered behind it.
      msz.pinchMoveFramePromiseRes();
      await afterEventLoop();

      msz._handleTapMove(touchEvent({ clientX: 52, clientY: 90, timeStamp: 140 }));
      expect(mode.scale).toBeGreaterThan(scaleAfterFirstMove);
      expect(mode.$visibleWorld.classList.contains('BRsmooth-zooming')).toBe(true);
    });

    test('drag up after a double-tap zooms out (matches Google Maps/Chrome)', async () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.bufferFn = (cb) => cb();

      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      await msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
      msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));
      msz._handleTapMove(touchEvent({ clientX: 52, clientY: 20, timeStamp: 120 }));

      expect(mode.scale).toBeLessThan(1);
    });

    describe('on iOS', () => {
      // Experimental: this competes with iOS's native double-tap-drag text
      // selection gesture. Enabled (with direction reversed, to match iOS's
      // own convention) so people can try it out and weigh in on whether
      // it's worth that tradeoff -- see _handleTapMove.
      test('drag down zooms out, and drag up zooms in (reversed, matching iOS\'s own gesture)', () => {
        sinon.stub(browserSniffing, 'isIOS').returns(true);
        const mode = dummy_mode();
        const msz = new ModeSmoothZoom(mode);
        msz.bufferFn = (cb) => cb();

        msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
        msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
        msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));
        // Drag down; on every other platform this zooms in, but on iOS it
        // should zoom out instead.
        msz._handleTapMove(touchEvent({ clientX: 52, clientY: 90, timeStamp: 120 }));

        expect(mode.scale).toBeLessThan(1);
      });

      test('drag up zooms in, on iOS', () => {
        sinon.stub(browserSniffing, 'isIOS').returns(true);
        const mode = dummy_mode();
        const msz = new ModeSmoothZoom(mode);
        msz.bufferFn = (cb) => cb();

        msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
        msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
        msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));
        msz._handleTapMove(touchEvent({ clientX: 52, clientY: 20, timeStamp: 120 }));

        expect(mode.scale).toBeGreaterThan(1);
      });

      test('touchAction is preemptively locked to none after a lone tap, same as other platforms', () => {
        sinon.stub(browserSniffing, 'isIOS').returns(true);
        const mode = dummy_mode();
        const msz = new ModeSmoothZoom(mode);
        msz.bufferFn = (cb) => cb();

        msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
        msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));

        expect(mode.$container.style.touchAction).toBe('none');
      });

      test('a second tap still suppresses the first tap\'s deferred single-tap action (e.g. page flip)', async () => {
        sinon.stub(browserSniffing, 'isIOS').returns(true);
        const mode = dummy_mode();
        const msz = new ModeSmoothZoom(mode);
        msz.bufferFn = (cb) => cb();

        msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
        await msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
        const resultPromise = msz.isSingleTap();

        msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));

        await expect(resultPromise).resolves.toBe(false);
      });
    });

    test('a lone tap locks touchAction to none, to block native panning if a second tap follows', async () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.bufferFn = (cb) => cb();
      expect(mode.$container.style.touchAction).not.toBe('none');

      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      await msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));

      expect(mode.$container.style.touchAction).toBe('none');
    });

    test('preventDefault is called on the very first pixel of movement, before the drag-engage threshold', () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.bufferFn = (cb) => cb();

      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
      msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));

      // A tiny move, well under DOUBLE_TAP_DRAG_ENGAGE_PX -- the zoom hasn't
      // engaged yet, but native panning must already be blocked so the
      // browser can't commit to a scroll before the engage threshold is hit.
      const tinyMove = touchEvent({ clientX: 52, clientY: 55, timeStamp: 110 });
      msz._handleTapMove(tinyMove);

      expect(tinyMove.preventDefault.callCount).toBe(1);
      expect(mode.$visibleWorld.classList.contains('BRsmooth-zooming')).toBe(false);
    });

    test('touchAction is restored once the double-tap-drag ends', async () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.attach();
      msz.bufferFn = (cb) => cb();
      msz.baseTouchAction = 'pan-x pan-y';

      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      await msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
      msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));
      msz._handleTapMove(touchEvent({ clientX: 52, clientY: 20, timeStamp: 120 }));
      expect(mode.$container.style.touchAction).toBe('none');
      msz.pinchMoveFramePromiseRes();

      await msz._handleTapUp(touchEvent({ clientX: 52, clientY: 20, timeStamp: 140 }));
      expect(mode.$container.style.touchAction).toBe('pan-x pan-y');
    });

    test('touchAction is restored if a second tap never arrives (candidate window times out)', () => {
      jest.useFakeTimers();
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.bufferFn = (cb) => cb();
      msz.baseTouchAction = 'pan-x pan-y';

      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
      expect(mode.$container.style.touchAction).toBe('none');

      jest.advanceTimersByTime(1000);
      expect(mode.$container.style.touchAction).toBe('pan-x pan-y');
      jest.useRealTimers();
    });

    test('the double-tap window is measured from the first tap\'s down, not its up', () => {
      jest.useFakeTimers();
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.bufferFn = (cb) => cb();
      msz.baseTouchAction = 'pan-x pan-y';

      // Down at t=0, up at t=290 (a slow, deliberate first tap).
      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 290 }));
      expect(mode.$container.style.touchAction).toBe('none');

      // Only 10ms of the 300ms window (measured from the down at t=0) is
      // left, even though only 10ms have passed since the up at t=290.
      jest.advanceTimersByTime(15);
      expect(mode.$container.style.touchAction).toBe('pan-x pan-y');
      jest.useRealTimers();
    });

    test('a stationary second tap does not change scale', async () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.bufferFn = (cb) => cb();

      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      await msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
      msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));
      await msz._handleTapUp(touchEvent({ clientX: 52, clientY: 52, timeStamp: 110 }));

      expect(mode.scale).toBe(1);
    });

    test('taps far apart in time do not start a double-tap-drag', () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.bufferFn = (cb) => cb();

      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
      // Second tap arrives after the double-tap window
      msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 1000 }));
      msz._handleTapMove(touchEvent({ clientX: 52, clientY: 20, timeStamp: 1020 }));

      expect(mode.scale).toBe(1);
    });

    test('mouse pointers do not trigger double-tap-drag', () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.bufferFn = (cb) => cb();

      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0, pointerType: 'mouse', touches: [] }));
      msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10, pointerType: 'mouse', touches: [] }));
      msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100, pointerType: 'mouse', touches: [] }));
      msz._handleTapMove(touchEvent({ clientX: 52, clientY: 20, timeStamp: 120, pointerType: 'mouse', touches: [] }));

      expect(mode.scale).toBe(1);
    });

    test('a second finger touching down cancels an in-progress double-tap-drag', async () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.attach();
      msz.bufferFn = (cb) => cb();

      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      await msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
      msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));
      msz._handleTapMove(touchEvent({ clientX: 52, clientY: 20, timeStamp: 120 }));
      expect(mode.$visibleWorld.classList.contains('BRsmooth-zooming')).toBe(true);
      const scaleWhenSecondFingerLands = mode.scale;
      msz.pinchMoveFramePromiseRes();

      // A second finger touches down mid-gesture; the resulting cancellation
      // is fire-and-forget from _handleTapMove, so wait a tick for it.
      msz._handleTapMove(touchEvent({ clientX: 52, clientY: 10, timeStamp: 130, touches: [{}, {}] }));
      await afterEventLoop();

      expect(mode.$visibleWorld.classList.contains('BRsmooth-zooming')).toBe(false);
      expect(mode.scale).toBe(scaleWhenSecondFingerLands);
    });

    test('a double-tap-drag does not start while pinching', () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      msz.bufferFn = (cb) => cb();
      msz.pinching = true;

      msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
      msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
      msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));
      msz._handleTapMove(touchEvent({ clientX: 52, clientY: 20, timeStamp: 120 }));

      expect(mode.scale).toBe(1);
    });

    describe('isSingleTap', () => {
      test('resolves true immediately when there is no pending tap (e.g. a mouse click)', async () => {
        const mode = dummy_mode();
        const msz = new ModeSmoothZoom(mode);

        await expect(msz.isSingleTap()).resolves.toBe(true);
      });

      test('resolves false once a second tap arrives before the window elapses', async () => {
        const mode = dummy_mode();
        const msz = new ModeSmoothZoom(mode);
        msz.bufferFn = (cb) => cb();

        msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
        await msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
        const resultPromise = msz.isSingleTap();

        // A second tap arrives in time -- this must resolve false.
        msz._handleTapDown(touchEvent({ clientX: 52, clientY: 52, timeStamp: 100 }));

        await expect(resultPromise).resolves.toBe(false);
      });

      test('resolves true if no second tap arrives before the window elapses', async () => {
        jest.useFakeTimers();
        const mode = dummy_mode();
        const msz = new ModeSmoothZoom(mode);
        msz.bufferFn = (cb) => cb();

        msz._handleTapDown(touchEvent({ clientX: 50, clientY: 50, timeStamp: 0 }));
        msz._handleTapUp(touchEvent({ clientX: 50, clientY: 50, timeStamp: 10 }));
        const resultPromise = msz.isSingleTap();

        jest.advanceTimersByTime(1000);

        await expect(resultPromise).resolves.toBe(true);
        jest.useRealTimers();
      });
    });
  });

  describe("updateViewportOnZoom", () => {
    test("adjusts scroll position when zooming in", () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      mode.$container.scrollTop = 100;
      mode.$container.scrollLeft = 100;

      msz.updateViewportOnZoom(2, 1);

      expect(mode.$container.scrollTop).toBeGreaterThan(100);
      expect(mode.$container.scrollLeft).toBeGreaterThan(100);
    });

    test("updates scroll position when zooming out", () => {
      const mode = dummy_mode();
      const msz = new ModeSmoothZoom(mode);
      mode.$container.scrollTop = 100;
      mode.$container.scrollLeft = 100;

      msz.updateViewportOnZoom(0.5, 1);

      expect(mode.$container.scrollTop).toBeLessThan(100);
      expect(mode.$container.scrollLeft).toBeLessThan(100);
    });
  });
});


describe("TouchesMonitor", () => {
  /** @type {HTMLElement} */
  let container;
  /** @type {TouchesMonitor} */
  let monitor;

  beforeEach(() => {
    container = document.createElement("div");
    monitor = new TouchesMonitor(container);
  });

  afterEach(() => {
    monitor.detach();
  });

  test("should start with 0 touches", () => {
    expect(monitor.touches).toBe(0);
  });

  test("should update touch count on touch events", () => {
    monitor.attach();
    container.dispatchEvent(new TouchEvent("touchstart", { touches: [{}] }));
    expect(monitor.touches).toBe(1);

    container.dispatchEvent(new TouchEvent("touchstart", { touches: [{}, {}] }));
    expect(monitor.touches).toBe(2);

    container.dispatchEvent(new TouchEvent("touchend", { touches: [{}] }));
    expect(monitor.touches).toBe(1);

    container.dispatchEvent(new TouchEvent("touchend", { touches: [] }));
  });

  test("should detach all listeners", () => {
    const spy = EventTargetSpy.wrap(container);
    monitor.attach();
    expect(spy._totalListenerCount).toBeGreaterThan(0);
    monitor.detach();
    expect(spy._totalListenerCount).toBe(0);
  });
});
