// Tests for BookReaderPreview.php

// Depends on common.js

module("Preview");

function Book(identifier, previewWidth, coverWidth, titleWidth, imageSize, bookId) {
    this.identifier = identifier;
    this.previewWidth = previewWidth;
    this.coverWidth = coverWidth;
    this.titleWidth = titleWidth;
    if (bookId === undefined) {
        bookId = identifier;
    }
    this.bookId = bookId;
}

var books = [
    // Old books using title page as cover (ignoring marked cover)
    new Book('coloritsapplicat00andriala', 1974, 1974, 1974),
    new Book('lietuvostsrmoksl50liet', 1887, 1887, 1887),
    new Book('oldtestamentrevi02slsn', 2019, 2019, 2019),
    
    // Protected book with marked cover returned as cover
    new Book('joyofsoaringtrai00conw', 2571, 2571, 2419)
    
];

for (index in books) {
    (function() {
        var i = index; // closure
    
        asyncTest("Load preview for " + books[index].identifier, function() {
            expect(2);
    
            var book = books[i];    
            var identifier = book.identifier;            
            
            var pageURI = previewURL(identifier, book.bookId, 'preview');
            var img = new Image();
            $(img).bind( 'load error', function(eventObj) {
                equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
                equals(this.width, book.previewWidth, 'Preview width');
                start();
            })
            .attr('src', pageURI);
            
            img = null;
        });
        
        asyncTest("Load cover for " + books[index].identifier, function() {
            expect(2);
    
            var book = books[i];    
            var identifier = book.identifier;
            
            var pageURI = previewURL(identifier, book.bookId, 'cover');
            var img = new Image();
            $(img).bind( 'load error', function(eventObj) {
                equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
                equals(this.width, book.coverWidth, 'Cover width');
                start();
            })
            .attr('src', pageURI);
            
            img = null;
        });
        
        asyncTest("Load title for " + books[index].identifier, function() {
            expect(2);
            
            var book = books[i];    
            var identifier = book.identifier;
            
            var pageURI = previewURL(identifier, book.bookId, 'title');
            var img = new Image();
            $(img).bind( 'load error', function(eventObj) {
                equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
                equals(this.width, book.titleWidth, 'Title image width');
                start();
            })
            .attr('src', pageURI);
            
            img = null;
        });
    })();
}

// Multi-book item
var identifier = 'SubBookTest';
asyncTest("Load title for book without title specified " + identifier, function() {
    expect(1);
        
    var pageURI = previewURL(identifier, identifier, 'title');
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'error', 'Load image (' + pageURI + '). Event handler called');
        start();
    })
    .attr('src', pageURI);
    
    img = null;
});

var subPrefix = 'subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume';
asyncTest("Load preview for book in sub-dir " + identifier + '/' + subPrefix, function() {
    expect(2);
        
    var pageURI = previewURL(identifier, subPrefix, 'title');
    var img = new Image();
    $(img).bind( 'load error', function(eventObj) {
        equals(eventObj.type, 'load', 'Load image (' + pageURI + '). Event handler called');
        equals(this.width, 5100, 'Preview image width');
        start();
    })
    .attr('src', pageURI);
    
    img = null;
});
