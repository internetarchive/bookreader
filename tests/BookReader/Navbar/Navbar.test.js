import { getNavPageNumHtml } from '../../../src/js/BookReader/Navbar/Navbar.js';

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
    })
});
