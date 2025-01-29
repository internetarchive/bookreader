import sinon from 'sinon';
import {ArchiveAnalyticsPlugin} from '@/src/plugins/plugin.archive_analytics.js';

describe('sendEvent', () => {
  test('logs if debug set to true', () => {
    const stub = sinon.stub(console, 'log');
    const p = new ArchiveAnalyticsPlugin({});
    p.setup({ debug: true });
    p.sendEvent();
    expect(stub.callCount).toBe(1);
    stub.restore();
  });

  test('Does not error if window.archive_analytics is undefined', () => {
    const p = new ArchiveAnalyticsPlugin({});
    const spy = sinon.spy(p.sendEvent);
    p.sendEvent();
    expect(spy.threw()).toBe(false);
  });
});
