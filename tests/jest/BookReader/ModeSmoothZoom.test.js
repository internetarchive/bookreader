import sinon from 'sinon';
import interact from 'interactjs';
import { EventTargetSpy, afterEventLoop } from '../utils.js';
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

describe('paragraph double-tap zoom', () => {
  let mode;
  let zoom;
  let layer;
  let paragraph;

  beforeEach(() => {
    jest.useFakeTimers();
    mode = dummy_mode();
    Object.defineProperty(mode.$container, 'clientWidth', { value: 200 });
    mode.$container.getBoundingClientRect = () => ({ left: 0, top: 0 });
    mode.updateComplete = Promise.resolve();
    layer = document.createElement('div');
    layer.className = 'BRtextLayer';
    layer.style.width = '1000px';
    layer.style.height = '1000px';
    layer.getBoundingClientRect = () => ({ left: 0, top: 0, width: 500, height: 500 });
    paragraph = document.createElement('p');
    paragraph.className = 'BRparagraphElement';
    paragraph.dataset.ocrCoords = '100,300,500,100';
    layer.appendChild(paragraph);
    mode.$container.appendChild(layer);
    document.body.appendChild(mode.$container);
    zoom = new ModeSmoothZoom(mode);
  });

  afterEach(() => {
    mode.$container.remove();
    jest.useRealTimers();
  });

  function tap(x = 75, y = 75) {
    zoom._touchStart({ touches: [{ clientX: x, clientY: y }] });
    const event = { touches: [], preventDefault: jest.fn() };
    zoom._touchEnd(event);
    return event;
  }

  test('fits the OCR paragraph to the viewport on a second tap', async () => {
    tap();
    const second = tap();
    await Promise.resolve();
    expect(second.preventDefault).toHaveBeenCalled();
    expect(mode.scale).toBe(1);
    expect(mode.autoFit).toBe('none');
  });

  test('scales a narrower paragraph further', async () => {
    paragraph.dataset.ocrCoords = '100,300,300,100';
    tap();
    tap();
    await Promise.resolve();
    expect(mode.scale).toBe(2);
  });

  test('leaves touches without OCR untouched', () => {
    layer.remove();
    tap();
    const second = tap();
    expect(second.preventDefault).not.toHaveBeenCalled();
    expect(mode.scale).toBe(1);
  });

  test('defers a two-page single tap and cancels it on double tap', () => {
    mode.$container.classList.add('BRmode2up');
    mode.br = { left: jest.fn(), right: jest.fn() };
    const page = document.createElement('div');
    page.className = 'BRpagecontainer';
    page.dataset.side = 'L';
    layer.replaceWith(page);
    page.appendChild(layer);
    expect(tap().preventDefault).toHaveBeenCalled();
    expect(mode.br.left).not.toHaveBeenCalled();
    tap();
    jest.advanceTimersByTime(300);
    expect(mode.br.left).not.toHaveBeenCalled();
  });

  test('a two-page single tap still turns the page', () => {
    mode.$container.classList.add('BRmode2up');
    mode.br = { left: jest.fn(), right: jest.fn() };
    const page = document.createElement('div');
    page.className = 'BRpagecontainer';
    page.dataset.side = 'R';
    layer.replaceWith(page);
    page.appendChild(layer);
    tap();
    jest.advanceTimersByTime(300);
    expect(mode.br.right).toHaveBeenCalledTimes(1);
  });

  test('movement and multitouch cancel a pending page turn', () => {
    mode.$container.classList.add('BRmode2up');
    mode.br = { left: jest.fn(), right: jest.fn() };
    const page = document.createElement('div');
    page.className = 'BRpagecontainer';
    page.dataset.side = 'L';
    layer.replaceWith(page);
    page.appendChild(layer);
    tap();
    zoom._touchStart({ touches: [{}, {}] });
    jest.advanceTimersByTime(300);
    expect(mode.br.left).not.toHaveBeenCalled();
  });
});
