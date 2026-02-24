// @ts-check
import  sinon from 'sinon';
import { ScrollClassAdder } from '@/src/BookReader/utils/ScrollClassAdder.js';

describe('ScrollClassAdder', () => {
  test('Does not attach during construction', () => {
    const element = document.createElement('div');
    const attachSpy = sinon.spy(ScrollClassAdder.prototype, 'attach');
    new ScrollClassAdder(element, 'foo');
    expect(attachSpy.callCount).toBe(0);
  });

  test('Attach/detach call correct methods', () => {
    const el = document.createElement('div');
    const addEventListenerSpy = sinon.spy(el, 'addEventListener');
    const removeEventListenerSpy = sinon.spy(el, 'removeEventListener');
    const sca = new ScrollClassAdder(el, 'foo');
    expect(addEventListenerSpy.callCount).toBe(0);
    sca.attach();
    expect(addEventListenerSpy.callCount).toBe(1);
    sca.detach();
    expect(removeEventListenerSpy.callCount).toBe(1);
  });

  test('onScroll adds class at right time', () => {
    const clock = sinon.useFakeTimers();
    const el = document.createElement('div');
    const sca = new ScrollClassAdder(el, 'foo');
    expect(el.getAttribute('class')).toBeFalsy();
    sca.onScroll();
    expect(el.getAttribute('class')).toBe('foo');
    clock.tick(600);
    expect(el.getAttribute('class')).toBeFalsy();

    sca.onScroll();
    expect(el.getAttribute('class')).toBe('foo');
    clock.tick(500);
    expect(el.getAttribute('class')).toBe('foo');
    sca.onScroll();
    expect(el.getAttribute('class')).toBe('foo');
    clock.tick(100);
    expect(el.getAttribute('class')).toBe('foo');
    clock.tick(499);
    expect(el.getAttribute('class')).toBe('foo');
    clock.tick(1);
    expect(el.getAttribute('class')).toBeFalsy();
    clock.restore();
  });
});
