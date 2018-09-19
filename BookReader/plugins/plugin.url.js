/**
 * Plugin for URL management in BookReader
 * Note read more about the url "fragment" here:
 * https://openlibrary.org/dev/docs/bookurls
 */

jQuery.extend(BookReader.defaultOptions, {
  enableUrlPlugin: true,
  bookId: "",
  // Defaults can be a urlFragment string
  defaults: null,
  updateWindowTitle: false,

  // 'history' | 'hash',
  urlMode: 'hash',

  // When using 'history' mode, this part of the URL is kept constant
  // Example: /details/plato/
  urlHistoryBasePath: '/',

  // Only these params will be reflected onto the URL
  urlTrackedParams: ['page', 'search', 'mode', 'region', 'highlight'],
});

BookReader.prototype.setup = (function(super_) {
  return function(options) {
    super_.call(this, options);

    this.enableUrlPlugin = options.enableUrlPlugin;
    this.bookId = options.bookId;
    this.defaults = options.defaults;

    this.locationPollId = null;
    this.oldLocationHash = null;
    this.oldUserHash = null;

    this.bind(BookReader.eventNames.PostInit, function(e, br) {
      if (br.options.updateWindowTitle) {
        document.title = br.shortTitle(50);
      }
      // br.urlStartLocationPolling();
    });

    this.bind(BookReader.eventNames.fragmentChange,
      this.urlUpdateFragment.bind(this)
    );
  };
})(BookReader.prototype.setup);

/**
 * Returns a shortened version of the title with the maximum number of characters
 * @param {string} maximumCharacters
 */
BookReader.prototype.shortTitle = function(maximumCharacters) {
  if (this.bookTitle.length < maximumCharacters) {
    return this.bookTitle;
  }

  var title = this.bookTitle.substr(0, maximumCharacters - 3);
  title += "...";
  return title;
};

/**
 * Starts polling of window.location to see hash fragment changes
 */
BookReader.prototype.urlStartLocationPolling = function() {
  var self = this;
  this.oldLocationHash = this.urlReadFragment();

  if (this.locationPollId) {
    clearInterval(this.locationPollID);
    this.locationPollId = null;
  }

  this.locationPollId = setInterval(function() {
    var newFragment = self.urlReadFragment();
    if (newFragment != self.oldLocationHash && newFragment != self.oldUserHash) {
      self.trigger(BookReader.eventNames.stop);

      // Queue change if animating
      if (self.animating) {
        self.autoStop();
        self.animationFinishedCallback = function() {
          self.updateFromParams(self.paramsFromFragment(newFragment));
        };
      } else {
        // update immediately
        self.updateFromParams(self.paramsFromFragment(newFragment));
      }
      self.oldUserHash = newFragment;
    }
  }, 500);
};

/**
 * Update URL from the current parameters.
 * Call this instead of manually using window.location.replace
 */
BookReader.prototype.urlUpdateFragment = function() {
  var newFragment = this.urlFragmentFromCurrent();
  var currFragment = this.urlReadFragment();

  if (currFragment !== newFragment) {
    if (this.options.urlMode === 'history') {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(
          {},
          null,
          this.options.urlHistoryBasePath
          + newFragment
          + window.location.search
        );
      }
    } else {
      window.location.replace('#' + newFragment);
    }
    this.oldLocationHash = newFragment;
  }
};

/**
 * Helper to get the fragment.
 * Will filter keys based on options.urlTrackedParams.
 * @return {string}
 */
BookReader.prototype.urlFragmentFromCurrent = function() {
  var allParams = this.paramsFromCurrent(true);
  var params = {};
  var param;

  for (var i = 0; i < this.options.urlTrackedParams.length; i++) {
    param = this.options.urlTrackedParams[i];
    if (param in allParams) {
      params[param] = allParams[param];
    }
  }

  return this.fragmentFromParams(params);
};

/**
 * Will read either the hash or URL and return the bookreader fragment
 * @return {string}
 */
BookReader.prototype.urlReadFragment = function() {
  if (this.options.urlMode === 'history') {
    return window.location.pathname.substr(this.options.urlHistoryBasePath.length);
  } else {
    return window.location.hash.substr(1);
  }
};

