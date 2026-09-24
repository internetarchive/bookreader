import sinon from 'sinon';
import { findScrollableAncestor, singleScrollIntoView } from '@/src/util/dom.js';

describe('findScrollableAncestor', () => {
  test('finds the nearest ancestor that actually overflows', () => {
    const outer = document.createElement('div');
    const container = document.createElement('div');
    const inner = document.createElement('div');
    outer.appendChild(container);
    container.appendChild(inner);

    container.style.overflowY = 'auto';
    Object.defineProperty(container, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 100, configurable: true });

    expect(findScrollableAncestor(inner)).toBe(container);
  });

  test('skips overflow ancestors whose content does not actually overflow', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    outer.appendChild(inner);

    outer.style.overflowY = 'auto';
    Object.defineProperty(outer, 'scrollHeight', { value: 100, configurable: true });
    Object.defineProperty(outer, 'clientHeight', { value: 100, configurable: true });

    expect(findScrollableAncestor(inner)).toBeNull();
  });

  test('returns null when there is no scrollable ancestor', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    outer.appendChild(inner);

    expect(findScrollableAncestor(inner)).toBeNull();
  });
});

describe('singleScrollIntoView', () => {
  /** Builds a mock scroll container with controllable rect/scroll dimensions */
  function mockContainer({ scrollTop = 0, scrollLeft = 0 } = {}) {
    const container = document.createElement('div');
    container.getBoundingClientRect = sinon.stub().returns({ top: 0, bottom: 100, left: 0, right: 100 });
    Object.defineProperty(container, 'scrollTop', { value: scrollTop, configurable: true });
    Object.defineProperty(container, 'scrollLeft', { value: scrollLeft, configurable: true });
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(container, 'scrollWidth', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientWidth', { value: 100, configurable: true });
    container.scrollTo = sinon.stub();
    return container;
  }

  test('scrolls the given container to bring a below-the-fold element to the top', () => {
    const container = mockContainer();
    const el = document.createElement('div');
    el.getBoundingClientRect = sinon.stub().returns({ top: 150, bottom: 170, left: 0, right: 20 });

    singleScrollIntoView(el, { block: 'start', scrollContainer: container });

    expect(container.scrollTo.calledOnce).toBe(true);
    expect(container.scrollTo.firstCall.args[0].top).toBe(150);
  });

  test('does not move the container when the element is already visible (nearest)', () => {
    const container = mockContainer({ scrollTop: 50 });
    const el = document.createElement('div');
    el.getBoundingClientRect = sinon.stub().returns({ top: 10, bottom: 50, left: 0, right: 20 });

    singleScrollIntoView(el, { block: 'nearest', scrollContainer: container });

    expect(container.scrollTo.firstCall.args[0].top).toBe(50);
  });

  test('clamps the resulting scroll position to the container bounds', () => {
    const container = mockContainer();
    const el = document.createElement('div');
    el.getBoundingClientRect = sinon.stub().returns({ top: -500, bottom: -480, left: 0, right: 20 });

    singleScrollIntoView(el, { block: 'start', scrollContainer: container });

    expect(container.scrollTo.firstCall.args[0].top).toBe(0);
  });

  test('falls back to the native scrollIntoView when no scroll container is found', () => {
    const el = document.createElement('div');
    const scrollIntoViewStub = el.scrollIntoView = sinon.stub();

    singleScrollIntoView(el, { block: 'center' });

    expect(scrollIntoViewStub.calledOnce).toBe(true);
  });
});
