// Tests for BookReaderImages.php

// Depends on common.js

module("Images");

/* Item no longer available
// Test image info - jpeg
asyncTest("JSLocate for armageddonafter00couruoft - jpeg", function() {
    expect(1);
    $.getScript( jsLocateURL('armageddonafter00couruoft'), function() {
        equals(br.bookTitle, 'Armageddon and after', 'Title');
        start();
    });
});

asyncTest("Image info for jpeg", function() {
    expect(3);
    var expected = {"width":1349,"height":2105,"bits":8,"type":"jpeg"};
    var imageInfoURL = br.getPageURI(8) + '&ext=json&callback=?';
    
    $.getJSON(imageInfoURL, function(data) {
        equals(data != null, true, 'data is not null');
        if (data != null) {
            equals(data.width, expected.width, 'Image width');
            same(data, expected, 'Image info object');
        }
        start();
    });
});
*/

// Test image info
asyncTest("JSLocate for zc-f-c-b-4 - 1-bit jp2", function() {
    expect(1);
    $.getScript( jsLocateURL('zc-f-c-b-4', 'concept-of-infection'), function() {
        equals(br.numLeafs, 13, 'numLeafs');
        start();
    });
});

asyncTest("Image info for 1-bit jp2", function() {
    expect(3);
    var expected = {"width":3295,"height":2561,"bits":1,"type":"jp2"};
    var imageInfoURL = br.getPageURI(0) + '&ext=json&callback=?';
    
    $.getJSON(imageInfoURL, function(data) {
        equals(data != null, true, 'data is not null');
        if (data != null) {
            equals(data.width, expected.width, 'Image width');
            same(data, expected, 'Image info object');
        }
        start();
    });
});

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


/// nybc200109 - 1-bit tiff zip
asyncTest("JSLocate for nybc200109 - 1-bit tiff.zip book", function() {
    expect(1);
    $.getScript( jsLocateURL('nybc200109'), function() {
        equals(br.numLeafs,
               694,
               'Number of pages');
        start();
    });
});

asyncTest("Image info for 1-bit tiff", function() {
    expect(3);
    var expected = {"width":5081,"height":6592,"bits":1,"type":"tiff"};
    var imageInfoURL = br.getPageURI(0) + '&ext=json&callback=?';
    
    $.getJSON(imageInfoURL, function(data) {
        equals(data != null, true, 'data is not null');
        if (data != null) {
            equals(data.width, expected.width, 'Image width');
            same(data, expected, 'Image info object');
        }
        start();
    });
});

asyncTest("Load 1-bit tiff image from zip", function() {
    expect(2);
    var pageURI = br.getPageURI(6, 16);
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 1272, 'Image width');
        start();
    })
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

asyncTest("Image info for 8-bit tiff", function() {
    expect(3);
    var expected = {"width":1275,"height":1650,"bits":8,"type":"tiff"};
    var imageInfoURL = br.getPageURI(0) + '&ext=json&callback=?';
    
    $.getJSON(imageInfoURL, function(data) {
        equals(data != null, true, 'data is not null');
        if (data != null) {
            equals(data.width, expected.width, 'Image width');
            same(data, expected, 'Image info object');
        }
        start();
    });
});

asyncTest("Load tiff image from zip", function() {
    expect(2);
    var pageURI = br.getPageURI(23, 8);
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 701, 'Image width');
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

asyncTest('Load jpg image from tar file - https://bugs.launchpad.net/bookreader/+bug/323003', function() {
    expect(2);
    var pageURI = br.getPageURI(6, 8);
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 243, 'Image width');
        start();
    })
    .attr('src', pageURI);
});

asyncTest('Load image region - /download/populationsc18400378unit/page/n800_x1544_y4144_w1192_h848_s4.jpg', function() {
    expect(3);
    var pageURI = testHost() + '/download/populationsc18400378unit/page/n800_x1544_y4144_w1192_h848_s4.jpg';
    
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 299, 'Image width');
        equals(this.height, 212, 'Image height');
        start();
    })
    .attr('src', pageURI);    

});

asyncTest('Load image region using decimal coordinates - /download/populationsc18400378unit/page/n800_x0.75_y0.75_w0.25_h0.25_s4.jpg', function() {
    expect(3);
    var pageURI = testHost() + '/download/populationsc18400378unit/page/n800_x0.75_y0.75_w0.25_h0.25_s4.jpg';
    
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 337, 'Image width');
        equals(this.height, 342, 'Image height');
        start();
    })
    .attr('src', pageURI);    

});


asyncTest('Load image region - /download/tomslademotorcyc00fitz/page/page3_x256_y96_w1720_h152_s4.jpg', function() {
    expect(3);
    var pageURI = testHost() + '/download/tomslademotorcyc00fitz/page/page3_x256_y96_w1720_h152_s4.jpg';
    
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 430, 'Image width');
        equals(this.height, 38, 'Image height');
        start();
    })
    .attr('src', pageURI);    

});

asyncTest('Load cover, fitting within 400x400', function() {
    expect(3);
    var pageURI = testHost() + '/download/mechanicstheor00loverich/page/cover_w400_h400.jpg';
    
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 264, 'Image width');
        equals(this.height, 487, 'Image height');
        start();
    })
    .attr('src', pageURI);    

});

asyncTest('Load cover, fitting within 100x400', function() {
    expect(3);
    var pageURI = testHost() + '/download/mechanicstheor00loverich/page/cover_w100_h400.jpg';
    
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 132, 'Image width');
        equals(this.height, 244, 'Image height');
        start();
    })
    .attr('src', pageURI);    

});


asyncTest('Load cover, fitting within 0.25x0.25 (weird but valid)', function() {
    expect(3);
    var pageURI = testHost() + '/download/mechanicstheor00loverich/page/cover_w0.25_h0.25.jpg';
    
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 1053, 'Image width');
        equals(this.height, 1946, 'Image height');
        start();
    })
    .attr('src', pageURI);    

});


asyncTest('Load image region from tiff, via br.getRegionURI - fightingflyingc00rickgoog - n17_x1944_y1708_w668_h584', function() {

    $.getScript( jsLocateURL('fightingflyingc00rickgoog'), function() {

        expect(3);
        var pageURI = br.getRegionURI(17, undefined, undefined, 1944, 1708, 668, 584);
        
        var img = new Image();
        $(img).bind( 'load error', function(eventObj) {
            equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
            equals(this.width, 668, 'Image width');
            equals(this.height, 584, 'Image height');
            start();
        })
        .attr('src', pageURI);
        
    });
});

asyncTest('Same image rotated 90 degrees, br.getRegionURI - fightingflyingc00rickgoog - n17_x1944_y1708_w668_h584_rot90', function() {

    $.getScript( jsLocateURL('fightingflyingc00rickgoog'), function() {

        expect(3);
        var pageURI = br.getRegionURI(17, undefined, 90, 1944, 1708, 668, 584);
        
        var img = new Image();
        $(img).bind( 'load error', function(eventObj) {
            equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
            equals(this.width, 584, 'Image width');
            equals(this.height, 668, 'Image height');
            start();
        })
        .attr('src', pageURI);
        
    });
});


asyncTest('Book that needs jp2 recovery since it does not contain enough reduction levels', function() {

    var identifier = 'Magic-Mouse-2010-12';

    expect(3);
    var pageURI = previewURL(identifier, null, 'cover_thumb.jpg');
    
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 160, 'Image width');
        equals(this.height, 207, 'Image height');
        start();
    })
    .attr('src', pageURI);

});
