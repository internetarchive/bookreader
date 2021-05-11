/* global BookReader */
/**

 */

return {
  loginUrl: `https://${this.baseHost}/account/login?${referrerStr}`,
  displayMode: this.signedIn ? 'bookmarks' : 'login',
  showItemNavigatorModal: this.showItemNavigatorModal.bind(this),
  closeItemNavigatorModal: this.closeItemNavigatorModal.bind(this),
  onBookmarksChanged: (bookmarks) => {
    const method = Object.keys(bookmarks).length ? 'add' : 'remove';
    this[`${method}MenuShortcut`]('bookmarks');
    this.updateMenuContents();
  },


jQuery.extend(BookReader.defaultOptions, {
  enableBookmarks: true,
  bookmarkOptions: {
    loginPath: `/account/login?referer=${encodeURIComponent(location.href)}`,
    bookmarksAPI: '/services/bookmarks.php',
    bookId: '',
    bookSubprefix: ''
  },
});

/** @override */
BookReader.prototype.setup = (function (super_) {
  return function (options) {
    super_.call(this, options);

    this.bookmarkOptions = options.bookmarkOptions;
    this.enableSearch = options.enableBookmarks;
    this.goToFirstResult = false;

    // Base server used by some api calls
    this.bookId = options.bookId;
    this.server = options.server;
    this.subPrefix = options.subPrefix;
    this.bookPath = options.bookPath;
  };
})(BookReader.prototype.setup);

/** @override */
BookReader.prototype.init = (function (super_) {
  return function () {
    super_.call(this);
  };
})(BookReader.prototype.init);