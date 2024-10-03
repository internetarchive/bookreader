import BookReader from '@/src/BookReader.js';
import * as utils from '@/src/BookReader/utils.js';

let br;
beforeAll(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
});

afterEach(() => {
  jest.clearAllMocks();
});

/**
 * Only run init() once. Otherwise multiple EventListeners will be added.
 */
test('Initialzation enables IntersectionObserver and defaults', () => {
  const observe = jest.fn();
  window.IntersectionObserver = jest.fn(() => ({
    observe,
  }));
  br.init();
  expect(br.hasKeyFocus).toBe(true);
  expect(observe).toHaveBeenCalledTimes(1);
});

describe('Keyboard shortcuts turned off', () => {

  test('Focus flag disables', () => {
    br.next = jest.fn();
    br.hasKeyFocus = false;
    const keyEvent = new KeyboardEvent('keydown', {'key': 'ArrowDown'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.next).toHaveBeenCalledTimes(0);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(0);
    // Must reset for following tests
    br.hasKeyFocus = true;
  });

  test('Input active disables', () => {
    // eslint-disable-next-line no-import-assign
    utils.isInputActive = jest.fn(() => true);
    br.next = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'ArrowDown'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.next).toHaveBeenCalledTimes(0);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(0);
    // Must reset for following tests
    utils.isInputActive.mockReset();
  });

});

describe('Keyboard shortcuts', () => {

  test('Home key', () => {
    br.first = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'Home'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.first).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('End key', () => {
    br.last = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'End'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.last).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('ArrowDown key', () => {
    br.mode = br.constMode2up;
    br.next = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'ArrowDown'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.next).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('PageDown key', () => {
    br.mode = br.constMode2up;
    br.next = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'PageDown'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.next).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('ArrowUp key', () => {
    br.mode = br.constMode2up;
    br.prev = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'ArrowUp'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.prev).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('PageUp key', () => {
    br.mode = br.constMode2up;
    br.prev = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'PageUp'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.prev).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('ArrowLeft key', () => {
    br.mode = br.constMode2up;
    br.left = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'ArrowLeft'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.left).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('ArrowRight key', () => {
    br.mode = br.constMode2up;
    br.right = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'ArrowRight'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.right).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('Subtract key', () => {
    br.zoom = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'Subtract'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.zoom).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('- key', () => {
    br.zoom = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': '-'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.zoom).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('Add key', () => {
    br.zoom = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'Add'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.zoom).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('+ key', () => {
    br.zoom = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': '+'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.zoom).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('= key', () => {
    br.zoom = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': '='});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.zoom).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('F key', () => {
    br.toggleFullscreen = jest.fn();
    const keyEvent = new KeyboardEvent('keydown', {'key': 'F'});
    keyEvent.preventDefault = jest.fn();
    document.dispatchEvent(keyEvent);
    expect(br.toggleFullscreen).toHaveBeenCalledTimes(1);
    expect(keyEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

});
