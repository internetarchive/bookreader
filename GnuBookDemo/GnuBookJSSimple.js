// 
// This file shows the minimum you need to provide to GnuBook to display a book
//
// Copyright(c)2008-2009 Internet Archive. Software license AGPL version 3.

// Create the GnuBook object
gb = new GnuBook();

// Return the width of a given page.  Here we assume all images are 800 pixels wide
gb.getPageWidth = function(index) {
    return 800;
}

// Return the height of a given page.  Here we assume all images are 1200 pixels high
gb.getPageHeight = function(index) {
    return 1200;
}

// We load the images from archive.org -- you can modify this function to retrieve images
// using a different URL structure
gb.getPageURI = function(index) {
    var leafStr = '000';            
    var imgStr = (index+1).toString();
    var re = new RegExp("0{"+imgStr.length+"}$");
    var url = 'http://www.archive.org/download/GnuBook/img/page'+leafStr.replace(re, imgStr) + '.jpg';
    return url;
}

// Return which side, left or right, that a given page should be displayed on
gb.getPageSide = function(index) {
    if (0 == (index & 0x1)) {
        return 'R';
    } else {
        return 'L';
    }
}

// For a given "accessible page index" return the page number in the book.
//
// For example, index 5 might correspond to "Page 1" if there is front matter such
// as a title page and table of contents.
gb.getPageNum = function(index) {
    return index+1;
}

// Total number of leafs
gb.numLeafs = 15;

// Book title and the URL used for the book title link
gb.bookTitle= 'Open Library Bookreader Presentation';
gb.bookUrl  = 'http://openlibrary.org';

// Let's go!
gb.init();
