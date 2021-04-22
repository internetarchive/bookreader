import sinon from 'sinon';
import { DebugConsole } from '../../src/BookReader/DebugConsole.js';

beforeEach(() => {
  sinon.stub(console, 'log');
});
afterEach(() => {
  sinon.restore();
});

test('hijacks console.log', () => {
  const _realLog = console.log;
  expect(_realLog).toBe(console.log);
  new DebugConsole().init();
  expect(_realLog).not.toBe(console.log);
});

test('logging the same thing twice does not create more entries', () => {
  const dc = new DebugConsole();
  dc.init();
  dc.logToScreen(['hello']);
  dc.logToScreen(['hello']);
  expect(dc.$log.children('.log-entry')).toHaveLength(1);
  expect(dc.$log.find('.count').text()).toBe('(2)');
});
