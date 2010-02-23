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


/// windwavesatseabr00bige - jp2 zip
asyncTest("JSLocate for windwavesatseabr00bige - Scribe jp2.zip book", function() {
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
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        start();
    })
    // Actually load the image
    .attr('src', pageURI);
});


/// asamoandictiona00pragoog - tiff zip
asyncTest("JSLocate for asamoandictiona00pragoog - tiff.zip book", function() {
    expect(1);
    $.getScript( jsLocateURL('asamoandictiona00pragoog'), function() {
        equals(br.bookTitle,
               'A Samoan dictionary: English and Samoan, and Samoan and English;',
               'Book title');
        start();
    });
});

asyncTest("Load tiff image from zip", function() {
    expect(2);
    var pageURI = br.getPageURI(23, 8);
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 351, 'Image width');
        start();
    })
    .attr('src', pageURI);
});


/// hccapp56191900uoft - jpeg tar
asyncTest("JSLocate for hccapp56191900uoft - jpg.tar", function() {
    expect(1);
    $.getScript( jsLocateURL('hccapp56191900uoft'), function() {
        equals(br.numLeafs, 1101, 'Number of pages');
        start();
    });
});

asyncTest('Load jpg image from tar file', function() {
    expect(2);
    var pageURI = br.getPageURI(6, 8);
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 244, 'Image width');
        start();
    })
    .attr('src', pageURI);
});

