require('../../../BookReader/BookReader.js');
require('../../../src/js/plugins/fullscreen_menu_toggle/plugin.fullscreen_menu_toggle.js');

let binder;
beforeEach(() => {
    document.querySelector = jest.fn(() => true);
    document.body.innerHTML = '<div id="BookReader">';

    BookReader.prototype.initToolbar = jest.fn();
    BookReader.prototype.initNavbar = jest.fn();
    BookReader.prototype.prepareOnePageView = jest.fn();
    BookReader.prototype.enterFullScreen = jest.fn();
    BookReader.prototype.bindNavigationHandlers = jest.fn();

    binder = jest.spyOn(BookReader.prototype, 'initFullScreenToggle');
})

afterEach(() => {
    jest.clearAllMocks();
    binder = null;
})

test('Plugin: Fullscreen Menu Toggle - successfully initializes', () => {
    expect(BookReader.defaultOptions.enableFullScreenMenuToggle).toEqual(true);
    expect(BookReader.prototype.initFullScreenToggle).toBeDefined();

    const bookrdr = new BookReader();
    bookrdr.init();

    expect(bookrdr.menuFullscreenFadeManager).toBeDefined();
    expect(binder).toHaveBeenCalled();
});
