require('../../../BookReader/BookReader.js');
require('../../../src/js/plugins/menu_toggle/plugin.menu_toggle.js');

let initializeSpy;
beforeEach(() => {
    document.querySelector = jest.fn(() => true);
    document.body.innerHTML = '<div id="BookReader">';
})

test('Plugin: Fullscreen Menu Toggle - successfully initializes', () => {
    expect(BookReader.defaultOptions.enableMenuToggle).toEqual(true);
});
