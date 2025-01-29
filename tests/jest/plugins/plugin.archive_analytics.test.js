import sinon from 'sinon';
import BookReader from '@/src/BookReader.js';
import {ArchiveAnalyticsPlugin} from '@/src/plugins/plugin.archive_analytics.js';

describe('sendEvent', () => {
  test('logs if debug set to true', () => {
    const stub = sinon.stub(console, 'log');
    const FAKE_BR = { options: { enableArchiveAnalytics: true, debugArchiveAnalytics: true }};
    const p = new ArchiveAnalyticsPlugin(FAKE_BR);
    p.sendEvent();
    expect(stub.callCount).toBe(1);
    stub.restore();
  });

  test('Does not error if window.archive_analytics is undefined', () => {
    const FAKE_BR = { options: { enableArchiveAnalytics: true }};
    const p = new ArchiveAnalyticsPlugin(FAKE_BR);
    const spy = sinon.spy(p.sendEvent);
    p.sendEvent();
    expect(spy.threw()).toBe(false);
  });
});
