// Tests for Search

// Depends on common.js

module("Search");

// Holds search text
var gSearchText = '';

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

function locateTest(title, identifier, book) {
    asyncTest("JSLocate for " + identifier, function() {
        expect(2);
        var locateURL = jsLocateURL(identifier, book);
        
        $.ajax({
            url: locateURL,
            dataType: 'script',
            complete: function() {
                try {
                    equals(typeof(br) != 'undefined', true, 'br is not undefined');
                    equals(br.bookTitle, title, 'Title');
                } catch (e) {
                }
                start();
            }
        });
    });
};

function searchXMLTest(bookReader, term, expected) {
    asyncTest("XML search results for " + term, function() {
        expect(1);
        setSearchText(undefined);
        var searchDataURL = searchURL(br, term, 'setSearchText');
        
        $.ajax({
            type: 'GET',
            url: searchDataURL,
            dataType: 'script',            
            complete: function() {
                equals(gSearchText, expected, "XML search results");
                start();
            }
        });
    });
};

locateTest('The Zenith Yearbook, 1993 High Point University', 'TheZenithYearbook1993HighPointUniversity', 'THE_ZENITH_1993');
var cassidyExpected = '<?xml version="1.0" encoding="utf-8"?><?xml-stylesheet type="text/css" href="blank.css"?><SEARCH><PAGE file="THE_ZENITH_1993_0021.djvu" width="2700" height="3451"><CONTEXT> Carr Mike </CONTEXT><WORD coords="1350,2937,1493,2903,2932">Cassidy</WORD><CONTEXT>  Mhari Cattell  Seniors </CONTEXT></PAGE></SEARCH>';
searchXMLTest(this.br, 'cassidy', cassidyExpected);

locateTest('A Nestable Tapered Column Concept for Large Space Structures', 'ANestableTaperedColumnConceptForLargeSpaceStructures', '19760022270_1976022270');
var nasaExpected = '<?xml version=\"1.0\" encoding=\"utf-8\"?><?xml-stylesheet type=\"text/css\" href=\"blank.css\"?><SEARCH><PAGE file=\"19760022270_1976022270_0001.djvu\" width=\"2504\" height=\"3112\"><CONTEXT> the Space </CONTEXT><WORD coords=\"1894,1738,2062,1700,1736\">Shuttle</WORD><CONTEXT>  and that nestable, tapered columns easily </CONTEXT></PAGE><PAGE file=\"19760022270_1976022270_0002.djvu\" width=\"2481\" height=\"3104\"><CONTEXT> for Space </CONTEXT><WORD coords=\"308,2896,479,2859,2895\">Shuttle</WORD><CONTEXT>  to be achieved and thereby minimize the </CONTEXT></PAGE><PAGE file=\"19760022270_1976022270_0003.djvu\" width=\"2468\" height=\"3099\"><CONTEXT> with Space </CONTEXT><WORD coords=\"1924,1137,2093,1100,1136\">Shuttle</WORD><CONTEXT>  to be achieved. All studies in </CONTEXT></PAGE><PAGE file=\"19760022270_1976022270_0004.djvu\" width=\"2475\" height=\"3099\"><CONTEXT> one Space </CONTEXT><WORD coords=\"881,1431,1048,1394,1430\">Shuttle</WORD><CONTEXT>  cargo bay, using various efficient structural </CONTEXT></PAGE><PAGE file=\"19760022270_1976022270_0007.djvu\" width=\"2488\" height=\"3114\"><CONTEXT> for Space </CONTEXT><WORD coords=\"1339,2376,1508,2340,2375\">Shuttle</WORD><CONTEXT>  with very efficient lightweight, structural components.</CONTEXT></PAGE><PAGE file=\"19760022270_1976022270_0008.djvu\" width=\"2488\" height=\"3102\"><CONTEXT> requires fewer </CONTEXT><WORD coords=\"1853,1687,2023,1650,1686\">shuttle</WORD><CONTEXT>  flights. Also it is shown that </CONTEXT></PAGE><PAGE file=\"19760022270_1976022270_0009.djvu\" width=\"2497\" height=\"3108\"><CONTEXT> for Space </CONTEXT><WORD coords=\"1953,1607,2121,1569,1605\">Shuttle</WORD><CONTEXT>  to offload cargos of men and/or </CONTEXT></PAGE><PAGE file=\"19760022270_1976022270_0010.djvu\" width=\"2459\" height=\"3078\"><CONTEXT> the Space </CONTEXT><WORD coords=\"1688,1063,1864,1022,1062\">Shuttle</WORD><CONTEXT>  and that nestable tapered columns easily eliminate </CONTEXT></PAGE><PAGE file=\"19760022270_1976022270_0014.djvu\" width=\"2464\" height=\"3081\"><CONTEXT> * </CONTEXT><WORD coords=\"335,1088,493,1052,1087\">Shuttle</WORD><CONTEXT>  Limit S o IS u u V </CONTEXT></PAGE><PAGE file=\"19760022270_1976022270_0015.djvu\" width=\"2460\" height=\"3087\"><CONTEXT> Number of </CONTEXT><WORD coords=\"870,2793,1040,2754,2792\">shuttle</WORD><CONTEXT>  flights required for placing a tetrahedral truss </CONTEXT></PAGE></SEARCH>';
searchXMLTest(this.br, 'shuttle', nasaExpected);

