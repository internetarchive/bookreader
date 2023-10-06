// This demo uses a slightly modified version of
// https://github.com/aeschylus/IIIFBookReader
//
// It is intended as a rapid proof of concept.
// More development could be done.

var br = new BookReader({
    // Book title and the URL used for the book title link
    bookTitle: 'Open Library BookReader Presentation',
    bookUrl: 'http://openlibrary.org',

    // Override the path used to find UI images
    imagesBaseURL: '../BookReader/images/',
});

br.IIIF({
    url: 'https://iiif.archivelab.org/iiif/platowithenglish04platuoft/manifest.json',
    sequenceId : 'https://iiif.archivelab.org/iiif/platowithenglish04platuoft/canvas/default',
    maxWidth: 800,
    initCallback: function() {
    }
});

// Let's go!
br.init();
