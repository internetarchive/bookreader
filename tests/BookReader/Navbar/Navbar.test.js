import '../../../BookReader/jquery-1.10.1.js';
import '../../../BookReader/jquery-ui-1.12.0.min.js';
import '../../../BookReader/jquery.browser.min.js';
import '../../../BookReader/dragscrollable-br.js';
import '../../../BookReader/jquery.colorbox-min.js';
import '../../../BookReader/jquery.bt.min.js';
import sinon from 'sinon';
import { getNavPageNumHtml, Navbar } from '../../../src/js/BookReader/Navbar/Navbar.js';
import BookReader from '../../../src/js/BookReader.js';

describe('getNavPageNumHtml', () => {
    const f = getNavPageNumHtml;
    test('handle n-prefixed page numbers', () => {
        expect(f(3, 40, 'n3', '', 40)).toBe('4&nbsp;/&nbsp;40');
    });

    test('handle regular page numbers', () => {
        expect(f(3, 40, '14', '', 40)).toBe('Page 14 of 40');
    });

    test('handle no max page', () => {
        expect(f(3, 40, '14', '', null)).toBe('Page 14');
    });
});

/** @type {BookReader} */
let br;
/** @type {Navbar} */
let navbar;
beforeEach(() => {
    document.body.innerHTML = '<div id="BookReader">';
    br = new BookReader({
        data: [
            [
                { width: 800, height: 1200,
                uri: '//archive.org/download/BookReader/img/page001.jpg' },
            ],
            [
                { width: 800, height: 1200,
                uri: '//archive.org/download/BookReader/img/page002.jpg' },
                { width: 800, height: 1200,
                uri: '//archive.org/download/BookReader/img/page003.jpg' },
            ],
            [
                { width: 800, height: 1200,
                uri: '//archive.org/download/BookReader/img/page004.jpg' },
                { width: 800, height: 1200,
                uri: '//archive.org/download/BookReader/img/page005.jpg' },
            ]
        ],
    });
    br.init();
    navbar = br._components.navbar;
});

afterEach(() => sinon.restore());

describe('Navbar slider', () => {
    test('while sliding, visible page number updates, but does not flip', () => {
        const $slider = navbar.$root.find('.BRpager');
        const jumpToIndexSpy = sinon.spy(br, 'jumpToIndex');
        expect(br.currentIndex()).toBe(0);

        $slider.trigger('slide', { value: 3 });

        expect(navbar.$root.find('.BRcurrentpage').text().includes('3'));
        expect(jumpToIndexSpy.callCount).toBe(0);
    });

    test('on slide change, actual page changes', () => {
        const $slider = navbar.$root.find('.BRpager');
        const jumpToIndexSpy = sinon.spy(br, 'jumpToIndex');
        expect(br.currentIndex()).toBe(0);

        $slider.trigger('slidechange', { value: 3 });

        expect(navbar.$root.find('.BRcurrentpage').text().includes('3'));
        expect(jumpToIndexSpy.callCount).toBe(1);
        expect(jumpToIndexSpy.args[0][0]).toBe(3);
    });
});
