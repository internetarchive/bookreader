// Tests for BookReaderPreview.php

// Depends on common.js

module("Preview");

var identifiers = [
    'coloritsapplicat00andriala',
    'lietuvostsrmoksl50liet',
    'oldtestamentrevi02slsn',
    'bokeofsaintalban00bernuoft'
];

for (index in identifiers) {
    var identifier = identifiers[index];
    asyncTest("Load preview for " + identifier, function() {
        expect(1);
        
        var pageURI = previewURL(identifier, identifier, 'preview');
        var img = new Image();
        $(img).bind( 'load error', function(eventObj) {
            equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
            start();
        })
        .attr('src', pageURI);
        
        img = null;
    });
    
    asyncTest("Load cover for " + identifier, function() {
        expect(1);
        
        var pageURI = previewURL(identifier, identifier, 'cover');
        var img = new Image();
        $(img).bind( 'load error', function(eventObj) {
            equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
            start();
        })
        .attr('src', pageURI);
        
        img = null;
    });
    
    asyncTest("Load title for " + identifier, function() {
        expect(1);
        
        var pageURI = previewURL(identifier, identifier, 'title');
        var img = new Image();
        $(img).bind( 'load error', function(eventObj) {
            equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
            start();
        })
        .attr('src', pageURI);
        
        img = null;
    });


}