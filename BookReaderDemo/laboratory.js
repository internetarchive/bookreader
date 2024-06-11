//
// This file shows the minimum you need to provide to BookReader to display a book
//
// Copyright(c)2008-2009 Internet Archive. Software license AGPL version 3.

// Create the BookReader object
function instantiateBookReader(selector, extraOptions) {
  selector = selector || '#BookReader';
  extraOptions = extraOptions || {};
  var options = {
    ppi: 300,
    data: [
      [
        { width: 2550, height: 3300,
          uri: '//fapestniegd.xen.prgmr.com/strategic_review/Strv101/0.png' },
        { width: 2550, height: 3300,
          uri: '//fapestniegd.xen.prgmr.com/strategic_review/Strv101/1.png' },
      ],
      [
        { width: 2550, height: 3300,
           uri: '//fapestniegd.xen.prgmr.com/strategic_review/Strv101/2.png' },
        { width: 2550, height: 3300,
           uri: '//fapestniegd.xen.prgmr.com/strategic_review/Strv101/3.png' },
      ],
      [
        { width: 2550, height: 3300,
           uri: '//fapestniegd.xen.prgmr.com/strategic_review/Strv101/4.png' },
        { width: 2550, height: 3300,
           uri: '//fapestniegd.xen.prgmr.com/strategic_review/Strv101/5.png' },
      ]
    ],

    // Book title and the URL used for the book title link
    bookTitle: 'BookReader Demo',
    bookUrl: '../index.html',
    bookUrlText: 'Back to Demos',
    bookUrlTitle: 'This is the book URL title',

    // thumbnail is optional, but it is used in the info dialog
    thumbnail: '//archive.org/download/BookReader/img/page014.jpg',
    // Metadata is optional, but it is used in the info dialog
    metadata: [
      {label: 'Title', value: 'Open Library BookReader Presentation'},
      {label: 'Author', value: 'Internet Archive'},
      {label: 'Demo Info', value: 'This demo shows how one could use BookReader with their own content.'},
    ],

    // Override the path used to find UI images
    imagesBaseURL: '../BookReader/images/',

    ui: 'full', // embed, full (responsive)

    el: selector,
  };
  $.extend(options, extraOptions);
  var br = new BookReader(options);
  br.init();
}
