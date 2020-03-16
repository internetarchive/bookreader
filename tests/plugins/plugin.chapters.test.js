import '../../BookReader/jquery-1.10.1.js';
import '../../BookReader/jquery-ui-1.12.0.min.js';
import '../../BookReader/jquery.browser.min.js';
import '../../BookReader/dragscrollable-br.js';
import '../../BookReader/jquery.colorbox-min.js';
import '../../BookReader/jquery.bt.min.js';

import BookReader from '../../src/js/BookReader.js';
import '../../src/js/plugins/plugin.chapters.js';

let br;
beforeEach(() => {
  $.ajax = jest.fn().mockImplementation((args) => {
    return Promise.resolve([{
      table_of_contents: [{
        "pagenum": "17",
        "level": 1,
        "label": "CHAPTER I",
        "type": {"key": "/type/toc_item"},
        "title": "THE COUNTRY AND THE MISSION"
      }]
    }]);
  });
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Plugin: Menu Toggle', () => {
  test('has option flag', () => {
    expect(BookReader.defaultOptions.enableChaptersPlugin).toEqual(true);
  });
  test('has added BR property: olHost', () => {
    expect(br).toHaveProperty('olHost');
    expect(br.olHost).toBeTruthy();
  });
  test('has added BR property: bookId', () => {
    expect(br).toHaveProperty('bookId');
    expect(br.bookId).toBeFalsy();
  });
  test('fetches OL Book Record on init', () => {
    br.getOpenLibraryRecord = jest.fn();
    br.init();
    expect(br.getOpenLibraryRecord).toHaveBeenCalled();
  });
  test('Updates Table of Contents when available', () => {
    br.init();
    expect($.ajax).toHaveBeenCalled();
  });
});
