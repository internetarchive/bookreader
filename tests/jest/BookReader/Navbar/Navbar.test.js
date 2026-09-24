import sinon from 'sinon';
import { getNavPageNumHtml, Navbar } from '@/src/BookReader/Navbar/Navbar.js';
import BookReader from '@/src/BookReader.js';

describe('getNavPageNumHtml', () => {
  const f = getNavPageNumHtml;

  test('handle n-prefixed page numbers', () => {
    expect(f(3, 40, 'n3', '', 40)).toBe('Page — (3/39)');
  });

  test('handle regular page numbers', () => {
    expect(f(3, 40, '14', '', 40)).toBe('Page 14 (3/39)');
  });

  test('handle no max page', () => {
    expect(f(3, 40, '14', '', null)).toBe('Page 14 (3/39)');
  });

  test('first leaf renders as 0', () => {
    expect(f(0, 40, '1', '', 40)).toBe('Page 1 (0/39)');
  });

  test('last leaf renders as numLeafs - 1', () => {
    expect(f(39, 40, '40', '', 40)).toBe('Page 40 (39/39)');
  });

  test('zero-leaf book renders as 0/0', () => {
    expect(f(0, 0, 'n0', '', null)).toBe('Page — (0/0)');
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
      ],
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
    const jumpToIndexStub = sinon.stub(br, 'jumpToIndex');
    expect(br.currentIndex()).toBe(0);

    $slider.trigger('slidechange', { value: 3 });

    expect(navbar.$root.find('.BRcurrentpage').text().includes('3'));
    expect(jumpToIndexStub.callCount).toBe(2);
    expect(jumpToIndexStub.args[0][0]).toBe(3);
  });
});

describe('Navbar controls overrides', () => {
  const createBRWithOverrides = (overrides) => {
    br = new BookReader(BookReader.extendOptions(br.options, overrides));
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
        },
      },
    };
    createBRWithOverrides(overrides);

    const $viewMode = navbar.$root.find('.viewmode');

    expect($viewMode.find('.icon-thumb').length).toBe(1);
    $viewMode.trigger("click");
    expect($viewMode.find('.icon-twopg').length).toBe(1);
    $viewMode.trigger("click");
    expect($viewMode.find('.icon-thumb').length).toBe(1);
  });

  test('when a control is set to visible: false, do not return a button template', () => {
    const overrides = {
      controls: {
        onePage: {
          visible: false,
        },
      },
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
          className: 'foo',
        },
      },
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
          ),
        },
      },
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
          visible: true,
        },
        onePage: {
          visible: false,
        },
      },
    };
    createBRWithOverrides(overrides);

    expect(navbar.$root.find('.viewmode').length).toBe(1);
    expect(navbar.$root.find('.onepg').length).toBe(0);
  });
});

describe('Navbar responsive controls', () => {
  /** @param {JQuery} $nav @param {string} control */
  const isHidden = ($nav, control) => (
    $nav.filter('.BRnavMain').find(`.controls .${control}`).hasClass('hide')
  );

  const createBRInShadowRoot = () => {
    document.body.innerHTML = '<div id="host"></div>';
    const shadowRoot = document.querySelector('#host').attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = '<div id="BookReader"></div>';
    br = new BookReader(BookReader.extendOptions(br.options, {
      el: shadowRoot.querySelector('#BookReader'),
      controls: { viewmode: { visible: true } },
    }));
    br.init();
    navbar = br._components.navbar;
    return shadowRoot;
  };

  test('showDesktopControls hides mobile controls inside a shadow root', () => {
    const shadowRoot = createBRInShadowRoot();
    expect(document.querySelector('.BRnavMain')).toBeNull();
    expect(shadowRoot.querySelector('.BRnavMain')).not.toBeNull();

    navbar.showDesktopControls();

    const { $nav } = navbar;
    expect($nav.filter('.BRnavMobile').hasClass('hide')).toBe(true);
    for (const control of ['toggle_slider', 'viewmode']) {
      expect(isHidden($nav, control)).toBe(true);
    }
    for (const control of ['BRnavpos', 'book_left', 'book_right', 'zoom_in', 'zoom_out']) {
      expect(isHidden($nav, control)).toBe(false);
    }
  });

  test('showMobileControls hides desktop controls inside a shadow root', () => {
    createBRInShadowRoot();
    navbar.showDesktopControls();

    navbar.showMobileControls();

    const { $nav } = navbar;
    expect($nav.filter('.BRnavMobile').hasClass('hide')).toBe(false);
    for (const control of ['toggle_slider', 'viewmode']) {
      expect(isHidden($nav, control)).toBe(false);
    }
    for (const control of ['BRnavpos', 'book_left', 'book_right', 'zoom_in', 'zoom_out']) {
      expect(isHidden($nav, control)).toBe(true);
    }
  });

  test('does not throw before the navbar is initialized', () => {
    const uninitialized = new Navbar(br);
    expect(() => uninitialized.showDesktopControls()).not.toThrow();
    expect(() => uninitialized.showMobileControls()).not.toThrow();
  });
});
