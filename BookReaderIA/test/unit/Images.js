// Tests for BookReaderImages.php

// $$$ TODO -- make the test host configurable/automagic

module("Images");

// $$$ set to test host
var testHost = 'http://www-mang.archive.org';

// Returns locator URL for the given id
function jsLocateURL(bookId) {
    return testHost + '/bookreader/BookReaderJSLocate.php?id=' + bookId;
}

// Set up dummy BookReader class for JSLocate
function BookReader() {
};

BookReader.prototype.init = function() {
    return true;
};

asyncTest("JSLocate for windwavesatseabr00bige", function() {
    expect(1);
    $.getScript( jsLocateURL('windwavesatseabr00bige'), function(data, textStatus) {
        equals(br.numLeafs, 224, 'JSLocate successful. numLeafs');
        start();
    });
});
    
test("Image URI for windwavesatseabr00bige page index 5", function() {
    expect(1);
    var index = 5;
    var expectedEnding = "file=windwavesatseabr00bige_jp2/windwavesatseabr00bige_0006.jp2&scale=1&rotate=0";
    var pageURI = br.getPageURI(index);
    var reg = new RegExp('file=.*$');
    var actualEnding = reg.exec(pageURI);
    equals(actualEnding, expectedEnding, 'URI for page index 5 ends with');
});

asyncTest("Load windwavesatseabr00bige image 5", function() {
    var pageURI = br.getPageURI(5);
    var img = new Image();
    $(img).bind( 'load', 'load handler', function(eventObj) {
        equals(eventObj.data, 'load handler', 'Load image (' + pageURI + '). Event handler called');
        start();
    })
    
    // Make sure tests are started in case of error loading image
    .bind('error', 'error handler', function(eventObj) {
        equals(eventObj.data, 'load handler', 'Load image (' + pageURI + '). Event handler called');
        start();
    })
    
    // Actually load the image
    .attr('src', pageURI);
});

asyncTest("JSLocate for asamoandictiona00pragoog - tiff book", function() {
    expect(1);
    $.getScript( jsLocateURL('asamoandictiona00pragoog'), function() {
        equals(br.bookTitle,
               'A Samoan dictionary: English and Samoan, and Samoan and English;',
               'Book title');
        start();
    });
});

asyncTest("Load tiff image", function() {
    expect(2);
    var pageURI = br.getPageURI(23, 8);
    var img = new Image();
    $(img).bind( 'load', 'load handler', function(eventObj) {
        equals(eventObj.data, 'load handler', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 351, 'Image width');
        start();
    })
    .bind( 'error', 'error handler', function(eventObj) {
        equals(eventObj.data, 'load handler', 'Load image (' + pageURI + '). Event handler called') ;
        equals(this.width, 351, 'Image width');
        start();
    })
    .attr('src', pageURI);
});