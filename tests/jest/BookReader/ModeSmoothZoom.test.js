import sinon from 'sinon';
import interact from 'interactjs';
import { EventTargetSpy, afterEventLoop } from '../utils.js';
import { ModeSmoothZoom } from '@/src/BookReader/ModeSmoothZoom.js';
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
    ...overrides
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
          top: 50
        }
      }
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
