import {PageContainer} from '../../src/js/BookReader/PageContainer.js';

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

describe('update', async () => {
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

  test('removes image between updates', () => {
    const fakeImageCache = {
      imageLoaded: () => true,
      image: () => $('<img/>'),
    };
    const pc = new PageContainer({index: 12}, {imageCache: fakeImageCache});
    pc.update({ reduce: 7 });
    const $im1 = pc.$img;
    pc.update({ reduce: 7 });
    const $im2 = pc.$img;
    expect($im1).not.toBe($im2);
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
