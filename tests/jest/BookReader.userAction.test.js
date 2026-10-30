import BookReader from '@/src/BookReader.js';

/** @type {BookReader} */
let br;

beforeEach(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader({ data: [[{ width: 123, height: 123, uri: 'https://archive.org/image0.jpg', pageNum: '1' }]] });
  br.init();
});

/** @returns {jest.Mock} */
function listenForUserAction() {
  const listener = jest.fn();
  window.addEventListener(`BookReader:${BookReader.eventNames.userAction}`, listener);
  return listener;
}

test('clicking anywhere in the BookReader signals a user action', () => {
  const listener = listenForUserAction();
  br.refs.$brContainer[0].dispatchEvent(new Event('pointerdown', { bubbles: true }));
  expect(listener).toHaveBeenCalled();
});

test('typing anywhere in the BookReader signals a user action', () => {
  const listener = listenForUserAction();
  br.refs.$brContainer[0].dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
  expect(listener).toHaveBeenCalled();
});

test('signals a user action even when a control stops propagation', () => {
  const $button = br.refs.$br.find('nav.BRcontrols button').first();
  expect($button.length).toBe(1);
  $button.on('pointerdown', (ev) => ev.stopPropagation());

  const listener = listenForUserAction();
  $button[0].dispatchEvent(new Event('pointerdown', { bubbles: true }));
  expect(listener).toHaveBeenCalled();
});

test('does not signal a user action for events outside the BookReader', () => {
  const listener = listenForUserAction();
  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  expect(listener).not.toHaveBeenCalled();
});

describe('when a shell wraps the BookReader', () => {
  /** @type {HTMLElement} */
  let shell;

  beforeEach(() => {
    shell = document.createElement('div');
    br.refs.$br[0].replaceWith(shell);
    shell.appendChild(br.refs.$br[0]);
    br.initShell(shell);
  });

  test('signals a user action for UI outside the BookReader element', () => {
    const sibling = shell.appendChild(document.createElement('nav'));
    const listener = listenForUserAction();
    sibling.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(listener).toHaveBeenCalled();
  });

  test('signals a user action exactly once for UI inside the BookReader', () => {
    const listener = listenForUserAction();
    br.refs.$brContainer[0].dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
