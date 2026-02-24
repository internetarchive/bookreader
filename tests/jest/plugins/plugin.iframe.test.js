import sinon from 'sinon';

import BookReader from '@/src/BookReader.js';
import { _attachEventListeners } from '@/src/plugins/plugin.iframe.js';

afterEach(() => {
  sinon.restore();
});

test('listens for br events if parent', () => {
  const br = new BookReader();
  sinon.spy(br, 'bind');
  sinon.spy(window, 'addEventListener');

  _attachEventListeners(br, window.parent);
  expect(br.bind.callCount).toBe(1);
  expect(window.addEventListener.callCount).toBe(1);
  expect(window.addEventListener.args[0][0]).toBe('message');
});

test('does not attach if not in iframe', () => {
  const br = new BookReader();
  sinon.spy(br, 'bind');
  sinon.spy(window, 'addEventListener');

  _attachEventListeners(br, null);
  expect(br.bind.callCount).toBe(0);
  expect(window.addEventListener.callCount).toBe(0);
});

test('updates params when window receives a message', () => {
  const br = new BookReader();
  sinon.spy(br, 'updateFromParams');
  _attachEventListeners(br);
  window.dispatchEvent(new MessageEvent('message', {
    data: {
      type: 'bookReaderFragmentChange',
      fragment: '',
    },
  }));
  expect(br.updateFromParams.callCount).toBe(1);
});
