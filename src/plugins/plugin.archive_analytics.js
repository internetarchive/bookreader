// @ts-check
import { BookReaderPlugin } from "../BookReaderPlugin.js";

const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);

/**
 * Plugin for Archive.org analytics
 */
jQuery.extend(BookReader.defaultOptions, {
  enableArchiveAnalytics: true,
  /** Provide a means of debugging, cause otherwise it's impossible to test locally */
  debugArchiveAnaltyics: false,
});

export class ArchiveAnalyticsPlugin extends BookReaderPlugin {
  /** @override */
  init() {
    if (this.br.enableArchiveAnalytics) {
      this.br.bind(BookReader.eventNames.fragmentChange, () => this.archiveAnalyticsSendFragmentChange());
    }
  }

  /** @private */
  archiveAnalyticsSendFragmentChange() {
    if (!window.archive_analytics) {
      return;
    }

    const prevFragment = this.archiveAnalyticsSendFragmentChange.prevFragment;

    const params = this.br.paramsFromCurrent();
    const newFragment = this.br.fragmentFromParams(params);

    if (prevFragment != newFragment) {
      const values = {
        bookreader: "user_changed_view",
        itemid: this.br.bookId,
        cache_bust: Math.random(),
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
      } catch (e) { }
      // avoids embed cross site exceptions -- but on (+) side, means it is and keeps marked offite!

      // Send bookreader ping
      window.archive_analytics.send_ping(values, null, "augment_for_ao_site");

      // Also send tracking event ping
      const additionalEventParams = this.br.options.lendingInfo?.loanId
        ? { loanId: this.br.options.lendingInfo.loanId }
        : {};
      window.archive_analytics.send_event('BookReader', 'UserChangedView', window.location.pathname, additionalEventParams);

      this.archiveAnalyticsSendFragmentChange.prevFragment = newFragment;
    }
  }

  /**
   * Sends a tracking "Event". See https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#events
   * @param {string} category
   * @param {string} action
   * @param {number} [value] (must be an int)
   * @param {Object} [additionalEventParams]
   */
  archiveAnalyticsSendEvent(category, action, value, additionalEventParams) {
    if (!this.br.options.enableArchiveAnalytics) return;

    if (this.br.options.debugArchiveAnaltyics) {
      console.log("archiveAnalyticsSendEvent", arguments, window.archive_analytics);
    }

    if (!window.archive_analytics) return;

    additionalEventParams = additionalEventParams || {};
    if (typeof (value) == 'number') {
      additionalEventParams.ev = value;
    }
    window.archive_analytics.send_event(category, action, null, additionalEventParams);
  }
}

BookReader.registerPlugin('archiveAnalytics', ArchiveAnalyticsPlugin);
