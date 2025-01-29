import sinon from 'sinon';
import BookReader from '@/src/BookReader.js';
import {ArchiveAnalyticsPlugin} from '@/src/plugins/plugin.archive_analytics.js';

describe('archiveAnalyticsSendEvent', () => {
  test('logs if debug set to true', () => {
    const stub = sinon.stub(console, 'log');
    const FAKE_BR = { options: { enableArchiveAnalytics: true, debugArchiveAnaltyics: true }};
    const p = new ArchiveAnalyticsPlugin(FAKE_BR);
    p.archiveAnalyticsSendEvent();
    expect(stub.callCount).toBe(1);
    stub.restore();
  });

  test('Does not error if window.archive_analytics is undefined', () => {
    const FAKE_BR = { options: { enableArchiveAnalytics: true }};
    const p = new ArchiveAnalyticsPlugin(FAKE_BR);
    const spy = sinon.spy(p.archiveAnalyticsSendEvent);
    p.archiveAnalyticsSendEvent();
    expect(spy.threw()).toBe(false);
  });
});
