/*global BookReader */

/**
 * Plugin which adds an autoplay feature. Useful for kiosk situations.
 */
jQuery.extend(BookReader.defaultOptions, {
  enableAutoPlayPlugin: true
});

/**
 * @override BookReader.setup
 */
BookReader.prototype.setup = (function(super_) {
  return function (options) {
    super_.call(this, options);

    this.auto      = false;
    this.autoTimer = null;
    this.flipDelay = 5000;
  };
})(BookReader.prototype.setup);

/**
 * @override BookReader.init
 */
BookReader.prototype.init = (function(super_) {
  return function (options) {
    super_.call(this, options);

    if (!this.options.enableAutoPlayPlugin) return;
    this.bind(BookReader.eventNames.stop, () => this.autoStop());
  };
})(BookReader.prototype.init);

/**
 * @override BookReader.bindNavigationHandlers
 */
BookReader.prototype.bindNavigationHandlers = (function(super_) {
  return function() {
    super_.call(this);

    if (!this.options.enableAutoPlayPlugin) return;

    // Note the mobile plugin attaches itself to body, so we need to select outside
    const jIcons = this.$('.BRicon').add('.BRmobileMenu .BRicon');

    jIcons.filter('.play').click(() => {
      this.autoToggle();
      return false;
    });

    jIcons.filter('.pause').click(() => {
      this.autoToggle();
      return false;
    });
  };
})(BookReader.prototype.bindNavigationHandlers);

/**
 * Starts autoplay mode
 * @param {object} overrides
 * @param {number} overrides.flipSpeed
 * @param {number} overrides.flipDelay
 */
BookReader.prototype.autoToggle = function(overrides) {
  if (!this.options.enableAutoPlayPlugin) return;

  const options = $.extend({
    flipSpeed: this.flipSpeed,
    flipDelay: this.flipDelay
  }, overrides);

  this.flipSpeed = typeof options.flipSpeed === "number" ? options.flipSpeed : this.flipSpeed;
  this.flipDelay = typeof options.flipDelay === "number" ? options.flipDelay : this.flipDelay;
  this.trigger(BookReader.eventNames.stop);

  let bComingFrom1up = false;
  if (this.constMode2up != this.mode) {
    bComingFrom1up = true;
    this.switchMode(this.constMode2up);
  }

  if (null == this.autoTimer) {
    // $$$ Draw events currently cause layout problems when they occur during animation.
    //     There is a specific problem when changing from 1-up immediately to autoplay in RTL so
    //     we workaround for now by not triggering immediate animation in that case.
    //     See https://bugs.launchpad.net/gnubook/+bug/328327
    if (('rl' == this.pageProgression) && bComingFrom1up) {
      // don't flip immediately -- wait until timer fires
    } else {
      // flip immediately
      this.next({ triggerStop: false });
    }

    this.$('.play').hide();
    this.$('.pause').show();
    this.autoTimer = setInterval(() => {
      if (this.animating) return;

      if (Math.max(this.twoPage.currentIndexL, this.twoPage.currentIndexR) >= this.book.getNumLeafs() - 1) {
        this.prev({ triggerStop: false }); // $$$ really what we want?
      } else {
        this.next({ triggerStop: false });
      }
    }, this.flipDelay);
  } else {
    this.autoStop();
  }
};

/**
 * Stop autoplay mode, allowing animations to finish
 */
BookReader.prototype.autoStop = function() {
  if (!this.options.enableAutoPlayPlugin) return;

  if (null != this.autoTimer) {
    clearInterval(this.autoTimer);
    this.flipSpeed = 'fast';
    this.$('.pause').hide();
    this.$('.play').show();
    this.autoTimer = null;
  }
};
