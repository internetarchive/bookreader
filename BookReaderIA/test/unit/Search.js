// Tests for Search

// $$$ TODO -- make the test host configurable/automagic
// $$$ Refactor common code across tests

module("Search");

// $$$ set to test host
//var gTestAccount = 'testflip';
var gTestAccount = 'mang'; // XXX
var gTestHost = 'http://www-' + gTestAccount + '.archive.org';

// Holds search text
var gSearchText = '';

test("Hello test", function() {
    expect(1);
    equals("Hello world", "Hello world", "Hi there");
});

// Returns locator URL for the given id
function jsLocateURL(identifier, book) {
    var bookURL = gTestHost + '/bookreader/BookReaderJSLocate.php?id=' + identifier;
    if (book) {
        bookURL += '&book=' + book;
    }
    return bookURL;
}

// Build search URL
function searchURL(bookReader, term, callback) {
    var url = 'http://' + bookReader.server
               + '/BookReader/flipbook_search_br.php?url='+escape(bookReader.bookPath + '_djvu.xml')
               +'&term='+escape(term)+'&format=XML&callback=' + callback;
    return url;
}

// Search, results to xmlCallback(txtData, textstatus) or errorCallback
function search(searchURL, xmlCallback, errorCallback) {
    $.ajax({
        type: 'GET',
        dataType: 'script',
        url: searchURL,
        success: xmlCallback,
        error: errorCallback
    }); 
}

function setSearchText(txtData) {
    gSearchText = txtData;
}

// Set up dummy BookReader class for JSLocate
function BookReader() {
};

BookReader.prototype.init = function() {
    return true;
};

asyncTest("JSLocate for TheZenithYearbook1993HighPointUniversity", function() {
    expect(2);
    var locateURL = jsLocateURL('TheZenithYearbook1993HighPointUniversity', 'THE_ZENITH_1993');
    
    $.ajax({
        url: locateURL,
        dataType: 'script',
        
        complete: function() {
            try {
                equals(typeof(br) != 'undefined', true, 'br is not undefined');
                equals(br.bookTitle, 'The Zenith Yearbook, 1993 High Point University', 'Title');
            } catch (e) {
            }
            start();
        }
    });
});

asyncTest("XML search results for cassidy", function() {
    expect(1);
    gSearchText = '';
    var searchDataURL = searchURL(br, 'cassidy', 'setSearchText');
    
    $.ajax({
        type: 'GET',
        url: searchDataURL,
        dataType: 'script',
        
        success: function() {
        },
        
        complete: function() {
            var expected = '<?xml version="1.0" encoding="utf-8"?><?xml-stylesheet type="text/css" href="blank.css"?><SEARCH><PAGE file="THE_ZENITH_1993_0021.djvu" width="2700" height="3451"><CONTEXT> Carr Mike </CONTEXT><WORD coords="1350,2937,1493,2903,2932">Cassidy</WORD><CONTEXT>  Mhari Cattell  Seniors </CONTEXT></PAGE></SEARCH>';
            equals(gSearchText, expected, "XML search results");
            start();
        }
    });
});

