// Tests for BookReaderJSLocate.php

// Depends on common.js

module("JSLocate");

// $$$ locate will fail when called from the same domain since the browser will not honour the
//     redirect to the datanode

asyncTest("JSLocate for notesonsubmarine00grea", function() {
    expect(1);
    $.getScript( jsLocateURL('notesonsubmarine00grea'),
        function(data, textStatus) {
            equals(window.br.titleLeaf, 5, 'Metadata loaded.  See https://bugs.launchpad.net/bookreader/+bug/517424. Title leaf');
            start();
        }
    );
});

asyncTest("JSLocate for photographingclo00carprich", function() {
    expect(1);
    $.getScript( jsLocateURL('photographingclo00carprich'),
        function(data, textStatus) {
            equals(window.br.bookTitle, 'Photographing clouds from an airplane',  'Title of book');
            start();
        }
    );
});

asyncTest("JSLocate for salmoncookbookho00panaiala", function() {
    expect(1);
    $.getScript( jsLocateURL('salmoncookbookho00panaiala'),
        function(data, textStatus) {
            equals(window.br.numLeafs, 40,  'Number of pages');
            start();
        }
    );
});
