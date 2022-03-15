import {PageContainer, boxToSVGRect, createSVGPageLayer, renderBoxesInPageContainerLayer} from '@/src/BookReader/PageContainer.js';

describe('constructor', () => {
  test('protected books', () => {
    const pc = new PageContainer(null, {isProtected: true});
    expect(pc.$container.hasClass('protected')).toBe(true);
    expect(pc.$container.find('.BRscreen').length).toBe(1);
  });

  test('non-protected books', () => {
    const pc = new PageContainer(null, {isProtected: false});
    expect(pc.$container.hasClass('protected')).toBe(false);
    expect(pc.$container.find('.BRscreen').length).toBe(0);
  });

  test('empty page', () => {
    const pc = new PageContainer(null, {isProtected: false});
    expect(pc.$container.hasClass('BRemptypage')).toBe(true);
  });

  test('non-empty page', () => {
    const pc = new PageContainer({index: 7}, {isProtected: false});
    expect(pc.$container.hasClass('BRemptypage')).toBe(false);
    expect(pc.$container.hasClass('pagediv7')).toBe(true);
  });

  test('adds side attribute', () => {
    const pc = new PageContainer({index: 7, pageSide: 'R'}, {isProtected: false});
    expect(pc.$container.hasClass('BRemptypage')).toBe(false);
    expect(pc.$container.attr('data-side')).toBe('R');
  });
});

describe('update', () => {
  test('dimensions sets CSS', () => {
    const pc = new PageContainer(null, {});
    pc.update({ dimensions: { left: 20 } });
    expect(pc.$container[0].style.left).toBe('20px');
  });

  test('does not create image if empty page', () => {
    const pc = new PageContainer(null, {});
    pc.update({ reduce: null });
    expect(pc.$img).toBeNull();
    pc.update({ reduce: 7 });
    expect(pc.$img).toBeNull();
  });

  test('does not create image if no reduce', () => {
    const pc = new PageContainer({index: 17}, {});
    pc.update({ reduce: null });
    expect(pc.$img).toBeNull();
  });

  test('does not set background image if already loaded', () => {
    const fakeImageCache = {
      imageLoaded: () => true,
      image: () => $('<img/>'),
    };
    const pc = new PageContainer({index: 12}, {imageCache: fakeImageCache});
    pc.update({ reduce: 7 });
    expect(pc.$img[0].style.background).toBe('');
  });

  test('removes image between updates only if changed', () => {
    const fakeImageCache = {
      imageLoaded: () => true,
      image: (index, reduce) => $(`<img src="page${index}-${reduce}.jpg" />`),
    };
    const pc = new PageContainer({index: 12}, {imageCache: fakeImageCache});
    pc.update({ reduce: 7 });
    const $im1 = pc.$img;
    pc.update({ reduce: 7 });
    expect(pc.$img).toBe($im1);
    pc.update({ reduce: 16 });
    expect(pc.$img).not.toBe($im1);
    expect($im1.parent().length).toBe(0);
  });

  test('adds/removes loading indicators while loading', () => {
    const fakeImageCache = {
      imageLoaded: () => false,
      image: () => $('<img/>'),
      getBestLoadedReduce: () => undefined,
    };
    const pc = new PageContainer({index: 12}, {imageCache: fakeImageCache, loadingImage: 'loading.gif'});
    pc.update({ reduce: 7 });
    expect(pc.$container.hasClass('BRpageloading')).toBe(true);
    // See https://github.com/jsdom/jsdom/issues/3169
    // expect(pc.$img.css('background')).toBeTruthy();
    // expect(pc.$img.css('background').includes('loading.gif')).toBe(true);
    // expect(pc.$img.css('background').includes(',')).toBe(false);

    pc.$img.trigger('loadend');
    expect(pc.$container.hasClass('BRpageloading')).toBe(false);
    expect(pc.$img.css('background')).toBeFalsy();
  });

  test('shows lower res image while loading if one available', () => {
    const fakeImageCache = {
      imageLoaded: () => false,
      image: () => $('<img/>'),
      getBestLoadedReduce: () => 3,
    };
    const fakePage = {
      index: 12,
      getURI: () => 'page12.jpg',
    };
    const pc = new PageContainer(fakePage, {imageCache: fakeImageCache, loadingImage: 'loading.gif'});
    pc.update({ reduce: 7 });
    // See https://github.com/jsdom/jsdom/issues/3169
    // expect(pc.$img.css('background').includes('page12.jpg')).toBe(true);
    pc.$img.trigger('loadend');
    expect(pc.$img.css('background')).toBeFalsy();
  });
});

describe('createSVGPageLayer', () => {
  test('Does what it says', () => {
    const svg = createSVGPageLayer({ width: 100, height: 200}, 'myClass');
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 200');
    expect(svg.getAttribute('class')).toContain('myClass');
  });
});

describe('boxToSVGRect', () => {
  test('Does what it says', () => {
    const rect = boxToSVGRect({ l: 100, r: 200, t: 300, b: 500 });
    expect(rect.getAttribute('x')).toBe('100');
    expect(rect.getAttribute('y')).toBe('300');
    expect(rect.getAttribute('width')).toBe('100');
    expect(rect.getAttribute('height')).toBe('200');
  });
});

describe('renderBoxesInPageContainerLayer', () => {
  test('Handles missing layer', () => {
    const container = document.createElement('div');
    const page = { width: 100, height: 200 };
    const boxes = [{l: 1, r: 2, t: 3, b: 4}];
    renderBoxesInPageContainerLayer('foo', boxes, page, container);
    expect(container.querySelector('.foo')).toBeTruthy();
    expect(container.querySelectorAll('.foo rect').length).toBe(1);
  });

  test('Handles existing layer', () => {
    const container = document.createElement('div');
    const layer = document.createElement('svg');
    layer.classList.add('foo');
    container.append(layer);

    const page = { width: 100, height: 200 };
    const boxes = [{l: 1, r: 2, t: 3, b: 4}];
    renderBoxesInPageContainerLayer('foo', boxes, page, container);
    expect(container.querySelector('.foo')).toBe(layer);
    expect(container.querySelectorAll('.foo rect').length).toBe(1);
  });

  test('Adds layer after image if it exists', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.classList.add('BRpageimage');
    container.append(img);

    const page = { width: 100, height: 200 };
    const boxes = [{l: 1, r: 2, t: 3, b: 4}];
    renderBoxesInPageContainerLayer('foo', boxes, page, container);
    expect(container.querySelector('.foo')).toBeTruthy();
    expect(container.children[0].getAttribute('class')).toBe('BRpageimage');
    expect(container.children[1].getAttribute('class')).toBe('BRPageLayer foo');
  });

  test('Renders all boxes', () => {
    const container = document.createElement('div');
    const page = { width: 100, height: 200 };
    const boxes = [{l: 1, r: 2, t: 3, b: 4}, {l: 1, r: 2, t: 3, b: 4}, {l: 1, r: 2, t: 3, b: 4}];
    renderBoxesInPageContainerLayer('foo', boxes, page, container);
    expect(container.querySelectorAll('.foo rect').length).toBe(3);
  });

  test('Handles no boxes', () => {
    const container = document.createElement('div');
    const page = { width: 100, height: 200 };
    const boxes = [];
    renderBoxesInPageContainerLayer('foo', boxes, page, container);
    expect(container.querySelectorAll('.foo rect').length).toBe(0);
  });
});
