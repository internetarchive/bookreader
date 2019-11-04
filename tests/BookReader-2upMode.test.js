require('../BookReader/BookReader.js');

afterEach(() => {
  jest.clearAllMocks();
});

describe('BookReader: 2 page view (2up)', () => {
  /* Functions to calculate area in question */
  test('has `twoPageFlipAreaHeight` function', () => {
    expect(BookReader.prototype.twoPageFlipAreaHeight).toBeDefined();
  });
  test('has `twoPageFlipAreaWidth` function', () => {
    expect(BookReader.prototype.twoPageFlipAreaWidth).toBeDefined();
  });
  test('has `twoPageFlipAreaTop` function', () => {
    expect(BookReader.prototype.twoPageFlipAreaTop).toBeDefined();
  });
  test('has `twoPageLeftFlipAreaLeft` function', () => {
    expect(BookReader.prototype.twoPageLeftFlipAreaLeft).toBeDefined();
  });
  test('has `twoPageRightFlipAreaLeft` function', () => {
    expect(BookReader.prototype.twoPageRightFlipAreaLeft).toBeDefined();
  });
  test('has `twoPageGetViewCenter` function', () => {
    expect(BookReader.prototype.twoPageGetViewCenter).toBeDefined();
  });
  test('has `twoPageCalculateReductionFactors` function', () => {
    expect(BookReader.prototype.twoPageCalculateReductionFactors).toBeDefined();
  });
  /* Functions that create 2 page view */
  test('has `prepareTwoPageView` function', () => {
    expect(BookReader.prototype.prepareTwoPageView).toBeDefined();
  });
  test('has `drawLeafsTwoPage` function', () => {
    expect(BookReader.prototype.drawLeafsTwoPage).toBeDefined();
  });
  test('has `setMouseHandlers2UP` function', () => {
    expect(BookReader.prototype.setMouseHandlers2UP).toBeDefined();
  });
  test('has `twoPageIsZoomedIn` function', () => {
    expect(BookReader.prototype.twoPageIsZoomedIn).toBeDefined();
  });
  test('has `zoom2up` function', () => {
    expect(BookReader.prototype.zoom2up).toBeDefined();
  });
  test('has `twoPageCenterView` function', () => {
    expect(BookReader.prototype.twoPageCenterView).toBeDefined();
  });
  test('has `setHilightCss2UP` function', () => {
    expect(BookReader.prototype.setHilightCss2UP).toBeDefined();
  });
});
