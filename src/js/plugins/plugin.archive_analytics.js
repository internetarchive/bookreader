/**
 * Plugin for Archive.org analytics
 */
jQuery.extend(BookReader.defaultOptions, {
  enableArchiveAnalytics: true
});

BookReader.prototype.init = (function(super_) {
  return function() {
    super_.call(this);

    if (this.options.enableArchiveAnalytics) {
      this.bind(BookReader.eventNames.fragmentChange, () => this.archiveAnalyticsSendFragmentChange());
    }
  };
})(BookReader.prototype.init);

/** @private */
BookReader.prototype.archiveAnalyticsSendFragmentChange = function() {
  if (!window.archive_analytics) {
    return;
  }

  var prevFragment = this.archiveAnalyticsSendFragmentChange.prevFragment;

  var params = this.paramsFromCurrent();
  var newFragment = this.fragmentFromParams(params);

  if (prevFragment != newFragment) {
    var values = {
      bookreader: "user_changed_view",
      itemid: this.bookId,
      cache_bust: Math.random()
    };
    // EEK!  offsite embedding and /details/ page books look the same in analytics, otherwise!
    values.offsite = 1;
    values.details = 0;
    try {
      values.offsite = window.top.location.hostname.match(/\.archive.org$/)
        ? 0
        : 1;
      values.details =
        !values.offsite && window.top.location.pathname.match(/^\/details\//)
          ? 1
          : 0;
    } catch (e) {}
    // avoids embed cross site exceptions -- but on (+) side, means it is and keeps marked offite!

    // Send bookreader ping
    archive_analytics.send_ping(values, null, "augment_for_ao_site");

    // Also send tracking event ping
    archive_analytics.send_event('BookReader', 'UserChangedView', null);

    this.archiveAnalyticsSendFragmentChange.prevFragment = newFragment;
  }
};
