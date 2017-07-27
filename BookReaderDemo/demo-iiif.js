// This demo uses a slightly modified version of
// https://github.com/aeschylus/IIIFBookReader
//
// It is intended as a rapid proof of concept.
// More development could be done.

var br = new BookReader();
br.IIIF({
    url: 'https://iiif.archivelab.org/iiif/platowithenglish04platuoft/manifest.json',
    sequenceId : 'https://iiif.archivelab.org/iiif/platowithenglish04platuoft/canvas/default',
    maxWidth: 800,
    initCallback: function() {
      // read-aloud and search need backend compenents and are not supported in the demo
      $('#BRtoolbar').find('.read').hide();
      $('.BRtoolbarSectionSearch').hide();
    }
});

br.getEmbedCode = function(frameWidth, frameHeight, viewParams) {
    return "Embed code not supported in bookreader demo.";
}

// Book title and the URL used for the book title link
br.bookTitle = 'Open Library BookReader Presentation';
br.bookUrl = 'http://openlibrary.org';

// Override the path used to find UI images
br.imagesBaseURL = '../BookReader/images/';

// Let's go!
br.init();
