/**
 * Plugin for URL management in BookReader
 */

jQuery.extend(true, BookReader.defaultOptions, {
    enableUrlPlugin: true,
    bookId: '',
    // Defaults can be a urlFragment string
    defaults: null,
});

BookReader.prototype.setup = (function(super_) {
    return function (options) {
        super_.call(this, options);

        this.enableUrlPlugin = options.enableUrlPlugin;
        this.bookId = options.bookId;
        this.defaults = options.defaults;

        this.bind('PostInit', function(e, br) {
            // Set document title -- may have already been set in enclosing html for
            // search engine visibility
            document.title = br.shortTitle(50);
            br.startLocationPolling();
        });
    };
})(BookReader.prototype.setup);


// shortTitle(maximumCharacters)
//________
// Returns a shortened version of the title with the maximum number of characters
BookReader.prototype.shortTitle = function(maximumCharacters) {
    if (this.bookTitle.length < maximumCharacters) {
        return this.bookTitle;
    }

    var title = this.bookTitle.substr(0, maximumCharacters - 3);
    title += '...';
    return title;
};


// startLocationPolling
//________
// Starts polling of window.location to see hash fragment changes
BookReader.prototype.startLocationPolling = function() {
    var self = this; // remember who I am
    self.oldLocationHash = window.location.hash;

    if (this.locationPollId) {
        clearInterval(this.locationPollID);
        this.locationPollId = null;
    }

    this.locationPollId = setInterval(function() {
        var newHash = window.location.hash;
        if (newHash != self.oldLocationHash && newHash != self.oldUserHash) {
            // Only process new user hash once
            self.trigger('stop');

            // Queue change if animating
            if (self.animating) {
                self.autoStop();
                self.animationFinishedCallback = function() {
                    self.updateFromParams(self.paramsFromFragment(newHash));
                }
            } else { // update immediately
                self.updateFromParams(self.paramsFromFragment(newHash));
            }
            self.oldUserHash = newHash;
        }
    }, 500);
};

// updateLocationHash
//________
// Update the location hash from the current parameters.  Call this instead of manually
// using window.location.replace
BookReader.prototype.updateLocationHash = function(skipAnalytics) {
    skipAnalytics = skipAnalytics || false;
    var params = this.paramsFromCurrent();
    var newHash = '#' + this.fragmentFromParams(params);
    if (window.location.hash != newHash) {
        window.location.replace(newHash);
    }

    // Send analytics events if the location hash is changed (page flip or mode change),
    // which indicates that the user is actively reading the book. This will cause the
    // archive.org download count for this book to increment (via setting the `bookreader` value),
    // and also send a tracking event (via setting the `kind` attribute to `event`).
    // Note that users with Adblock Plus will not send data to analytics.archive.org
    if (!skipAnalytics && typeof(archive_analytics) != 'undefined') {
        if (this.oldLocationHash != newHash) {
            var values = {
                'bookreader': 'user_changed_view',
                'itemid': this.bookId,
                'cache_bust': Math.random()
            };
            // EEK!  offsite embedding and /details/ page books look the same in analytics, otherwise!
            values.offsite=1;
            values.details=0;
            try{
              values.offsite=(                     window.top.location.hostname.match(/\.archive.org$/) ? 0 : 1);
              values.details=(!values.offsite  &&  window.top.location.pathname.match(/^\/details\//)   ? 1 : 0);
            } catch (e){} //avoids embed cross site exceptions -- but on (+) side, means it is and keeps marked offite!

            // Send bookreader ping
            archive_analytics.send_ping(values, null, 'augment_for_ao_site');

            // Also send tracking event ping
            archive_analytics.send_ping({
                kind: 'event',
                ec: 'BookReader',
                ea: 'UserChangedView',
                el: window.location.pathname,
                cache_bust: Math.random()
            });
        }
    }

    // This is the variable checked in the timer.  Only user-generated changes
    // to the URL will trigger the event.
    this.oldLocationHash = newHash;

    if (this.enablePageResume) {
        this.updateResumeValue(params.index);
    }
};


// paramsFromCurrent()
//________
// Create a params object from the current parameters.
BookReader.prototype.paramsFromCurrent = function() {

    var params = {};

    var index = this.currentIndex();
    var pageNum = this.getPageNum(index);
    if ((pageNum === 0) || pageNum) {
        params.page = pageNum;
    }

    params.index = index;
    params.mode = this.mode;

    // $$$ highlight
    // $$$ region

    // search
    if (this.enableSearch) {
        params.searchTerm = this.searchTerm;
    }

    return params;
};


// paramsFromFragment(urlFragment)
//________
// Returns a object with configuration parametes from a URL fragment.
//
// E.g paramsFromFragment(window.location.hash)
BookReader.prototype.paramsFromFragment = function(urlFragment) {
    // URL fragment syntax specification: http://openlibrary.org/dev/docs/bookurls

    var params = {};

    // For convenience we allow an initial # character (as from window.location.hash)
    // but don't require it
    if (urlFragment.substr(0,1) == '#') {
        urlFragment = urlFragment.substr(1);
    }

    // Simple #nn syntax
    var oldStyleLeafNum = parseInt( /^\d+$/.exec(urlFragment) );
    if ( !isNaN(oldStyleLeafNum) ) {
        params.index = oldStyleLeafNum;

        // Done processing if using old-style syntax
        return params;
    }

    // Split into key-value pairs
    var urlArray = urlFragment.split('/');
    var urlHash = {};
    for (var i = 0; i < urlArray.length; i += 2) {
        urlHash[urlArray[i]] = urlArray[i+1];
    }

    // Mode
    if ('1up' == urlHash['mode']) {
        params.mode = this.constMode1up;
    } else if ('2up' == urlHash['mode']) {
        params.mode = this.constMode2up;
    } else if ('thumb' == urlHash['mode']) {
        params.mode = this.constModeThumb;
    }

    // Index and page
    if ('undefined' != typeof(urlHash['page'])) {
        // page was set -- may not be int
        params.page = urlHash['page'];
    }

    // $$$ process /region
    // $$$ process /search

    if (urlHash['search'] != undefined) {
        params.searchTerm = BookReader.util.decodeURIComponentPlus(urlHash['search']);
    }

    // $$$ process /highlight

    // $$$ process /theme
    if (urlHash['theme'] != undefined) {
        params.theme = urlHash['theme']
    }
    return params;
};



// fragmentFromParams(params)
//________
// Create a fragment string from the params object.
// See http://openlibrary.org/dev/docs/bookurls for an explanation of the fragment syntax.
BookReader.prototype.fragmentFromParams = function(params) {
    var separator = '/';

    var fragments = [];

    if ('undefined' != typeof(params.page)) {
        fragments.push('page', params.page);
    } else {
        if ('undefined' != typeof(params.index)) {
            // Don't have page numbering but we do have the index
            fragments.push('page', 'n' + params.index);
        }
    }

    // $$$ highlight
    // $$$ region

    // mode
    if ('undefined' != typeof(params.mode)) {
        if (params.mode == this.constMode1up) {
            fragments.push('mode', '1up');
        } else if (params.mode == this.constMode2up) {
            fragments.push('mode', '2up');
        } else if (params.mode == this.constModeThumb) {
            fragments.push('mode', 'thumb');
        } else {
            throw 'fragmentFromParams called with unknown mode ' + params.mode;
        }
    }

    // search
    if (params.searchTerm) {
        fragments.push('search', params.searchTerm);
    }

    return BookReader.util.encodeURIComponentPlus(fragments.join(separator)).replace(/%2F/g, '/');
};
