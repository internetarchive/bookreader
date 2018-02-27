//
// This file shows the minimum you need to provide to BookReader to display a book
//
// Copyright(c)2008-2009 Internet Archive. Software license AGPL version 3.

// Create the BookReader object
var options = {
  data: [
    [
    //   { width: 2448, height: 2448, pageNum: 0,
    //     uri: '//ia800104.us.archive.org/10/items/SCALExploSat/IMG_2250.jpg?cnt=0' },
    // ],
    // [
    //   { width: 2448, height: 2448, pageNum: 0,
    //     uri: 'https://ia800104.us.archive.org/10/items/SCALExploSat/IMG_2250.jpg?cnt=0' },
      { width: 800, height: 1200, pageNum: 1,
        uri: '//www.archive.org/download/BookReader/img/page001.jpg' },
    ],
    [
      { width: 800, height: 1200, pageNum: 2,
        uri: '//www.archive.org/download/BookReader/img/page002.jpg' },
      { width: 800, height: 1200, pageNum: 3,
        uri: '//www.archive.org/download/BookReader/img/page003.jpg' },
    ],
    [
      { width: 800, height: 1200, pageNum: 4,
        uri: '//www.archive.org/download/BookReader/img/page004.jpg' },
      { width: 800, height: 1200, pageNum: 5,
        uri: '//www.archive.org/download/BookReader/img/page005.jpg' },
    ],
    [
      { width: 800, height: 1200, pageNum: 6,
        uri: '//www.archive.org/download/BookReader/img/page006.jpg' },
      { width: 800, height: 1200, pageNum: 7,
        uri: '//www.archive.org/download/BookReader/img/page007.jpg' },
    ],
    [
      { width: 800, height: 1200, pageNum: 8,
        uri: '//www.archive.org/download/BookReader/img/page008.jpg' },
      { width: 800, height: 1200, pageNum: 9,
        uri: '//www.archive.org/download/BookReader/img/page009.jpg' },
    ],
    [
      { width: 800, height: 1200, pageNum: 10,
        uri: '//www.archive.org/download/BookReader/img/page010.jpg' },
      { width: 800, height: 1200, pageNum: 11,
        uri: '//www.archive.org/download/BookReader/img/page011.jpg' },
    ],
    [
      { width: 800, height: 1200, pageNum: 12,
        uri: '//www.archive.org/download/BookReader/img/page012.jpg' },
      { width: 800, height: 1200, pageNum: 13,
        uri: '//www.archive.org/download/BookReader/img/page013.jpg' },
    ],
    [
      { width: 800, height: 1200, pageNum: 14,
        uri: '//www.archive.org/download/BookReader/img/page014.jpg' },
      { width: 800, height: 1200, pageNum: 15,
        uri: '//www.archive.org/download/BookReader/img/page015.jpg' },
    ],
  ],

  // Book title and the URL used for the book title link
  bookTitle: 'Richard\'s BookReader Presentation',
  bookUrl: 'http://www.archive.org/details/BookReader',
  bookUrlText: 'Back to Archive.org',
  bookUrlTitle: 'Back to Archive.org',
  // thumbnail is optional, but it is used in the info dialog
  thumbnail: '//www.archive.org/download/BookReader/img/page014.jpg',
  // Metadata is optional, but it is used in the info dialog
  metadata: [
    {label: 'Title', value: 'Open Library BookReader Presentation'},
    {label: 'Author', value: 'Internet Archive'},
    {label: 'Demo Info', value: 'This demo shows how one could use BookReader with their own content.'},
  ],
  // This toggles the mobile drawer (not shown in 'embed' mode)
  enableMobileNav: true,
  mobileNavTitle: 'BookReader demo',

  // Override the path used to find UI images
  imagesBaseURL: '../BookReader/images/',

  ui: 'full', // embed, full (responsive)

};
var br = new BookReader(options);

// Let's go!
br.init();

// read-aloud and search need backend compenents and are not supported in the demo
$('#BRtoolbar').find('.read').hide();
$('.BRtoolbarSectionSearch').hide();
