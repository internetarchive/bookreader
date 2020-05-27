import '../../BookReader/jquery-1.10.1.js';
import '../../BookReader/jquery-ui-1.12.0.min.js';
import '../../BookReader/jquery.browser.min.js';
import '../../BookReader/dragscrollable-br.js';
import '../../BookReader/jquery.colorbox-min.js';
import '../../BookReader/jquery.bt.min.js';

import sinon from 'sinon';
import { deepCopy } from '../utils.js';
import { Mode2Up } from '../../src/js/BookReader/Mode2Up.js';
import BookReader from '../../src/js/BookReader.js';

afterEach(() => {
    sinon.restore();
});

/** @type {BookReaderOptions['data']} */
const SAMPLE_DATA = [
    [
        { width: 123, height: 123, uri: 'https://archive.org/image0.jpg', pageNum: '1' },
    ],
    [
        { width: 123, height: 123, uri: 'https://archive.org/image1.jpg', pageNum: '2' },
        { width: 123, height: 123, uri: 'https://archive.org/image2.jpg', pageNum: '3' },
    ],
    [
        { width: 123, height: 123, uri: 'https://archive.org/image3.jpg', pageNum: '4' },
    ],
];

describe('zoom', () => {
    test('stops animations when zooming', () => {
        const br = new BookReader({ data: SAMPLE_DATA });
        br.init();

        const stopAnim = sinon.spy(br, 'stopFlipAnimations');
        br._modes.mode2Up.zoom('in');
        expect(stopAnim.callCount).toBe(1);
    });
});
