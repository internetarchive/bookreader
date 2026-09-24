import sinon from 'sinon';

import BookReader from '@/src/BookReader.js';
import { IframePlugin } from '@/src/plugins/plugin.iframe.js';

afterEach(() => {
  sinon.restore();
});

test('listens for br events if parent', () => {
  const br = new BookReader();
  const plugin = new IframePlugin(br);
  sinon.spy(br, 'bind');
  sinon.spy(window, 'addEventListener');

  plugin.init();
  expect(br.bind.callCount).toBe(1);
  expect(window.addEventListener.callCount).toBe(1);
  expect(window.addEventListener.args[0][0]).toBe('message');
});

test('does not attach if not in iframe', () => {
  const br = new BookReader();
  const plugin = new IframePlugin(br);
  sinon.stub(window, 'parent').value(null);
  sinon.spy(br, 'bind');
  sinon.spy(window, 'addEventListener');

  plugin.init();
  expect(br.bind.callCount).toBe(0);
  expect(window.addEventListener.callCount).toBe(0);
});

test('updates params when window receives a message', () => {
  const br = new BookReader();
  const plugin = new IframePlugin(br);
  sinon.spy(br, 'updateFromParams');
  plugin.init();
  window.dispatchEvent(new MessageEvent('message', {
    data: {
      type: 'bookReaderFragmentChange',
      fragment: '',
    },
  }));
  expect(br.updateFromParams.callCount).toBe(1);
});
