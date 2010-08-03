// Defines common variables for testing

// What host to use for testing
function testHost() {
    // Autodetect if running from a home directory, or use live site
    var user = null;
    var patterns = [ new RegExp('.*?/~(.*?)/'), new RegExp('www-(.*?)\\.') ]
    for (index in patterns) {
        var match = patterns[index].exec(document.location.href);
        if (match) {
            user = match[1];
            break;
        }
    }
    
    if (user) {
        return 'http://www-' + user + '.archive.org';
    }
    
    return 'http://www.archive.org'; // live site
}

var common = {
    testHost: testHost(),
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

// Page should be in ['cover','title','preview']
function previewURL(identifier, subPrefix, page) {
    var bookPrefix = subPrefix || identifier;
    var previewPage = bookPrefix + '_' + page;
    return imagePermalink(identifier, subPrefix, previewPage);
}

// Page should be e.g. page5.jpg, n4.jpg, cover_t.jpg, n4_r3.jpg
function imagePermalink(identifier, subPrefix, page) {
    var imageURL = common.testHost + '/download/' + identifier;
    if (subPrefix) {
        imageURL += '/' + subPrefix;
    }
    imageURL += '/page/' + page;
    return imageURL;
}
