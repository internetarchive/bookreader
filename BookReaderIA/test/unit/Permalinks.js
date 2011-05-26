
// Depends on common.js

module("Permalinks");

test("Permalink format - /download/{itemid}/page/{page specifier}.jpg", function() {
    expect(1);
    var page = 'page4.jpg';
    var itemId = 'handbookofdorking00denn';

    var pageURI = imagePermalink(itemId, null, page);
    equals(pageURI, common.testHost + '/download/handbookofdorking00denn/page/page4.jpg');
});

(function() {
    var page = 'page4.jpg';
    var itemId = 'handbookofdorking00denn';

    asyncTest("Page " + page + " from " + itemId, function() {
        expect(2);
    
        
        var pageURI = imagePermalink(itemId, null, page);
        
        var img = new Image();
        $(img).bind( 'load error', function(eventObj) {
            equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
            equals(this.width, 1566, 'Image width');
            start();
        })
        .attr('src', pageURI);
        
        img = null;
    });
})();

(function() {
    var itemId = 'SubBookTest';
    var page = 'n9.jpg';
    var subPrefix = 'subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume';
    
    asyncTest("Sub-dir book - Page " + page + " from " + itemId + '/' + subPrefix, function() {
        expect(2);
        
        var pageURI = imagePermalink(itemId, subPrefix, page);
        
        var img = new Image();    
        $(img).bind( 'load error', function(eventObj) {
            equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
            equals(this.width, 5100, 'Image width');
            start();
        })
        .attr('src', pageURI);
        
        img = null;
    });
})();

(function() {
    var itemId = 'nasa_techdoc_20050157919';
    var page = 'n20_thumb_rot90.jpg';
    var subPrefix = '20050157919';
    
    asyncTest("Rotated thumbnail - Page " + page + " from " + itemId + '/' + subPrefix, function() {
        expect(2);
        
        var pageURI = imagePermalink(itemId, subPrefix, page);
        
        var img = new Image();    
        $(img).bind( 'load error', function(eventObj) {
            equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
            equals(this.width, 179, 'Image width');
            start();
        })
        .attr('src', pageURI);
        
        img = null;
    });
})();

(function() {
    var itemId = 'nasa_techdoc_20050157919';
    var page = 'preview_thumb.jpg';
    var subPrefix = null;
    
    asyncTest("Preview image for book in subdir without specifying sub-dir - Page " + page + " from " + itemId, function() {
        expect(2);
        
        var pageURI = imagePermalink(itemId, subPrefix, page);
        
        var img = new Image();    
        $(img).bind( 'load error', function(eventObj) {
            equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
            equals(this.width, 122, 'Image width');
            start();
        })
        .attr('src', pageURI);
        
        img = null;
    });
})();