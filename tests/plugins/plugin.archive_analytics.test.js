import sinon from 'sinon';
import '../../src/js/BookReader.js';
import '../../src/js/plugins/plugin.archive_analytics.js';

describe('archiveAnalyticsSendEvent', () => {
    const sendEvent = BookReader.prototype.archiveAnalyticsSendEvent;

    test('logs if debug set to true', () => {
        const stub = sinon.stub(console, 'log');
        const FAKE_BR = { options: { enableArchiveAnalytics: true, debugArchiveAnaltyics: true }};
        sendEvent.call(FAKE_BR);
        expect(stub.callCount).toBe(1);
        stub.restore();
    });

    test('Does not error if window.archive_analytics is undefined', () => {
        const spy = sinon.spy(sendEvent);
        const FAKE_BR = { options: { enableArchiveAnalytics: true }};
        spy.call(FAKE_BR);
        expect(spy.threw()).toBe(false);
    });
});

