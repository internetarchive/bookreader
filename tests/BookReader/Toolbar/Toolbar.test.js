import sinon from 'sinon';

import { createPopup } from '../../../src/js/BookReader/Toolbar/Toolbar.js';

afterEach(() => {
    sinon.restore();
})

describe('createPopup', () => {
    test('calls window.open', () => {
        const openSpy = sinon.spy(window, 'open');
        createPopup('openlibrary.org', 100, 100, 'Open Library');
        expect(openSpy.callCount).toBe(1);
    });

    test('opens in center', () => {
        const openSpy = sinon.spy(window, 'open');
        createPopup('openlibrary.org', 100, 100, 'Open Library');
        // jest default window size is 1024x768
        expect(openSpy.args[0]).toEqual([
            'openlibrary.org',
            'Open Library',
            'status=1,width=100,height=100,top=334,left=462'
        ]);
    });
});
