require('../../../BookReader/BookReader.js');
require('../../../src/js/plugins/menu_toggle/plugin.menu_toggle.js');

let initializeSpy;
beforeEach(() => {
    document.querySelector = jest.fn(() => true);
    document.body.innerHTML = '<div id="BookReader">';

    BookReader.prototype.initToolbar = jest.fn();
    BookReader.prototype.initNavbar = jest.fn();
    BookReader.prototype.prepareOnePageView = jest.fn();
    BookReader.prototype.enterFullScreen = jest.fn();
    BookReader.prototype.bindNavigationHandlers = jest.fn();

    initializeSpy = jest.spyOn(BookReader.prototype, 'initMenuToggle');
})

afterEach(() => {
    jest.clearAllMocks();
    initializeSpy = null;
})

test('Plugin: Fullscreen Menu Toggle - successfully initializes', () => {
    expect(BookReader.defaultOptions.enableMenuToggle).toEqual(true);
    expect(BookReader.prototype.initMenuToggle).toBeDefined();

    const bookrdr = new BookReader();
    bookrdr.init();

    expect(bookrdr.menuToggle).toBeDefined();
    expect(initializeSpy).toHaveBeenCalled();
});
