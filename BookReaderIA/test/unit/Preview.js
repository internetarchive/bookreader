// Tests for BookReaderPreview.php

// Depends on common.js

module("Preview");

function Book(identifier, previewWidth, coverWidth, titleWidth, bookId) {
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
    new Book('coloritsapplicat00andriala', 1974, 2346, 1974),
    new Book('lietuvostsrmoksl50liet', 1887, 1747, 1887),
    new Book('oldtestamentrevi02slsn', 2019, 2371, 2019)
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
asyncTest("Load title for " + identifier, function() {
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

asyncTest("Load title for " + identifier, function() {
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
