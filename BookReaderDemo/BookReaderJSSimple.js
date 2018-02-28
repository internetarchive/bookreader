//
// This file shows the minimum you need to provide to BookReader to display a book
//
// Copyright(c)2008-2009 Internet Archive. Software license AGPL version 3.

// Create the BookReader object
var options = {
  data: [
    [
      { width: 800, height: 1200,
        uri: '//archive.org/download/BookReader/img/page001.jpg' },
    ],
    [
      { width: 800, height: 1200,
        uri: '//archive.org/download/BookReader/img/page002.jpg' },
      { width: 800, height: 1200,
        uri: '//archive.org/download/BookReader/img/page003.jpg' },
    ],
    [
      { width: 800, height: 1200,
        uri: '//archive.org/download/BookReader/img/page004.jpg' },
      { width: 800, height: 1200,
        uri: '//archive.org/download/BookReader/img/page005.jpg' },
    ]
  ],

  // Book title and the URL used for the book title link
  bookTitle: 'Simple BookReader Presentation',
  bookUrl: 'https://archive.org/details/BookReader',
  bookUrlText: 'Back to Archive.org',
  bookUrlTitle: 'Back to Archive.org',

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

  el: '#BookReader',
};
var br = new BookReader(options);

// Let's go!
br.init();
