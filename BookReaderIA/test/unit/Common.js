// Defines common variables for testing

// $$$ TODO make test host auto-magic
common = {
    testHost: 'http://www-testflip.archive.org'
    //testHost: 'http://www-mang.archive.org'    
}

// Set up dummy BookReader class for JSLocate
function BookReader() {
};

BookReader.prototype.init = function() {
    return true;
};


// Returns locator URL for the given id
function jsLocateURL(identifier, book) {
    var bookURL = common.testHost + '/bookreader/BookReaderJSLocate.php?id=' + identifier;
    if (book) {
        bookURL += '&book=' + book;
    }
    return bookURL;
}

function previewURL(identifier, subPrefix, page) {
    var imageURL = common.testHost + '/download/' + identifier;
    var bookPrefix = identifier;
    if (subPrefix) {
        imageURL += '/' + subPrefix;
        var subPrefixParts = subPrefix.split('/')
        bookPrefix = subPrefixParts[subPrefixParts.length - 1];
    }
    imageURL += '/page/' + bookPrefix + '_' + page + '.jpg';
    return imageURL;
}