import '../../../src/js/jquery-ui-wrapper.js';
import 'jquery.browser';
import sinon from 'sinon';
import { getNavPageNumHtml } from '../../../src/js/BookReader/Navbar/Navbar.js';
import BookReader from '../../../src/js/BookReader.js';

describe('getNavPageNumHtml', () => {
  const f = getNavPageNumHtml;
  test('handle n-prefixed page numbers', () => {
    expect(f(3, 40, 'n3', '', 40)).toBe('Page (4 of 40)');
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

describe('Navbar controls overrides', () => {
  const createBRWithOverrides = (overrides) => {
    br = new BookReader($.extend(true, br.options, overrides));
    br.init();
    navbar = br._components.navbar;
  };

  test(`when a view mode is excluded,
      the mode should not be used in viewport toggling`, () => {
    const overrides = {
      controls: {
        viewmode: {
          visible: true,
          className: 'viewmode',
          excludedModes: [1],
        }
      }
    };
    createBRWithOverrides(overrides);

    const $viewMode = navbar.$root.find('.viewmode');

    expect($viewMode.find('.icon-thumb').length).toBe(1);
    $viewMode.click();
    expect($viewMode.find('.icon-twopg').length).toBe(1);
    $viewMode.click();
    expect($viewMode.find('.icon-thumb').length).toBe(1);
  });

  test('when a control is set to visible: false, do not return a button template', () => {
    const overrides = {
      controls: {
        onePage: {
          visible: false
        }
      }
    };
    createBRWithOverrides(overrides);

    expect(navbar.$root.find('.onepg').length).toBe(0);
    expect(navbar.$root.find('.twopg').length).toBe(1);
  });

  test(`when a control's className is overridden,
      the class should be used in place of the default`, () => {
    const overrides = {
      controls: {
        onePage: {
          className: 'foo'
        }
      }
    };
    createBRWithOverrides(overrides);

    expect(navbar.$root.find(`.${overrides.controls.onePage.className}`).length).toBe(1);
    expect(navbar.$root.find('.onepg').length).toBe(0);
  });

  test(`when a control's template is overridden,
      the HTML output should match the template provided`, () => {
    const overrides = {
      controls: {
        onePage: {
          template: () => (
            '<button id="foo"></button>'
          )
        }
      }
    };
    createBRWithOverrides(overrides);

    expect(navbar.$root.find('#foo').length).toBe(1);
    expect(navbar.$root.find('.onepg').length).toBe(0);
  });

  test(`when viewmode control set to visible,
      the individual view mode controls are not rendered`, () => {
    const overrides = {
      controls: {
        viewmode: {
          visible: true
        },
        onePage: {
          visible: false
        }
      }
    };
    createBRWithOverrides(overrides);

    expect(navbar.$root.find('.viewmode').length).toBe(1);
    expect(navbar.$root.find('.onepg').length).toBe(0);
  });
});
