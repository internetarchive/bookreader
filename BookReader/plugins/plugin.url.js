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
        var br = this;

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

        this.bind(
            BookReader.eventNames.fragmentChange,
            function handleFragmentChange() {
                br.updateLocationHash();
            }
        );
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
                    self.updateFromParams(
                        self.paramsFromFragment(newHash.substr(1))
                    );
                }
            } else { // update immediately
                self.updateFromParams(self.paramsFromFragment(
                    newHash.substr(1))
                );
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
    var params = this.paramsFromCurrent(true);

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
