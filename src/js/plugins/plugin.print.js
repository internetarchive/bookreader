/* global BookReader */

/**
 * Plugin which used to print book images.
 */
jQuery.extend(BookReader.defaultOptions, {
  imageFormat: 'jp2',
  subPrefix: '',
  server: '',
  zip: '',
});

/** @override */
BookReader.prototype.setup = (function (super_) {
  return function (options) {
    super_.call(this, options);

    this.imageFormat = options.imageFormat;
    this.subPrefix = options.subPrefix;
    this.server = options.server;
    this.zip = options.zip;
  };
})(BookReader.prototype.setup);

/**
 * Print page of any book item
 */
BookReader.prototype.printPage = function() {
  window.open(
    this.getPrintURI(),
    'printpage',
    'width=400, height=500, resizable=yes, scrollbars=no, toolbar=no, location=no'
  );
};

/**
 * Generate print URL from current indices and mode
 *
 * @returns {string} URL
 */
BookReader.prototype.getPrintURI = function() {
  let indexToPrint;
  if (this.constMode2up === this.mode) {
    indexToPrint = this.twoPage.currentIndexL;
  } else {
    indexToPrint = this.firstIndex; // $$$ the index in the middle of the viewport would make more sense
  }

  let options = 'id=' + this.subPrefix + '&server=' + this.server + '&zip=' + this.zip
    + '&format=' + this.imageFormat + '&file=' + this.getPageFile(indexToPrint)
    + '&width=' + this._getPageWidth(indexToPrint) + '&height=' + this._getPageHeight(indexToPrint);

  if (this.constMode2up === this.mode) {
    options += '&file2=' + this.getPageFile(this.twoPage.currentIndexR) + '&width2=' + this._getPageWidth(this.twoPage.currentIndexR);
    options += '&height2=' + this._getPageHeight(this.twoPage.currentIndexR);
    options += '&title=' + encodeURIComponent(this.shortTitle(50) + ' - Pages ' + this.getPageNum(this.twoPage.currentIndexL) + ', ' + this.getPageNum(this.twoPage.currentIndexR));
  } else {
    options += '&title=' + encodeURIComponent(this.shortTitle(50) + ' - Page ' + this.getPageNum(indexToPrint));
  }

  return '/bookreader/print.php?' + options;
};

/**
 * Get file from lead index to create print URL
 *
 * @returns {null|string}
 */
BookReader.prototype.getPageFile = function(index) {
  if (index === null) {
    return '';
  }
  const leafStr = '0000';
  const imgStr = String(index); // String(this._leafMap[index]); // if index != leafNum
  const re = new RegExp("0{"+imgStr.length+"}$");
  const insideZipPrefix = this.subPrefix.match('[^/]+$');
  const file = insideZipPrefix + '_' + this.imageFormat + '/' + insideZipPrefix + '_' + leafStr.replace(re, imgStr) + '.' + this.imageFormat;
  return file;
}
